#!/usr/bin/env python3
"""
Build chuẩn hóa danh mục môn học thật HVHC từ file Excel gốc.

Input : file Excel 1 sheet, cột [Mã môn học, Tên môn học, Tên khoa, Tên bộ môn]
Output:
  - prisma/seed/data/mon_hoc_hvhc.json : danh mục môn (dedup theo maMon)
  - prisma/seed/data/bo_mon_hvhc.json  : danh sách Bộ môn (distinct (Khoa, Bộ môn)) để seed Unit

Chạy: python3 scripts/build_mon_hoc_data.py "/duong/dan/Ma mon hoc - chuan.xlsx"
"""
import sys, json, re, unicodedata
from pathlib import Path
import pandas as pd

# Map tên Khoa (đúng chính tả trong file Excel) -> code Unit hiện có trong seed_units.ts
KHOA_NAME_TO_CODE = {
    "Khoa Chỉ huy hậu cần": "K1",
    "Khoa Quân nhu": "K2",
    "Khoa Vận tải": "K3",
    "Khoa Xăng dầu": "K4",
    "Khoa Doanh trại": "K5",
    "Khoa Tài chính": "K6",
    "Khoa Quân sự": "K7",
    "Khoa Lý luận Mác-Lênin, Tư tưởng Hồ Chí Minh": "K8",
    "Khoa Công tác Đảng, Công tác Chính trị": "K9",
    "Khoa Khoa học cơ bản": "K10",
    "Khoa Ngoại ngữ": "K11",
    "Khoa Hậu cần chiến dịch": "K14",
    # Bucket map sang Unit hiện có (không phải Khoa giảng dạy)
    "Viện Nghiên cứu Khoa học Hậu cần": "B12",
    "Ban Khảo thí & kiểm định chất lượng Đào tạo": "B14",
    "Học viện Hậu cần": "HVHC",
    "Phòng Kỹ thuật": "PKT",  # đơn vị thêm mới trong seed_units.ts
}
# Khoa = đơn vị giảng dạy thật -> mới sinh Bộ môn con
ACADEMIC_KHOA_CODES = {"K1","K2","K3","K4","K5","K6","K7","K8","K9","K10","K11","K14"}
# Bucket không gán khoaId (giữ string)
NULL_KHOA = {"Không tên", "Ngoài trường", "Dạy ở Lục quân 1", "Hệ, Tiểu đoàn"}
# Tên Bộ môn coi như "chưa gán" -> không tạo Unit, boMonId = null
UNASSIGNED_BOMON = {"Không tên"}


def strip_accents_slug(s: str) -> str:
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = s.replace("đ", "d").replace("Đ", "D")
    s = re.sub(r"[^A-Za-z0-9]+", "", s)
    return s.upper()


def main():
    if len(sys.argv) < 2:
        print("Usage: build_mon_hoc_data.py <excel_path>"); sys.exit(1)
    excel = sys.argv[1]
    out_dir = Path(__file__).resolve().parent.parent / "prisma" / "seed" / "data"
    out_dir.mkdir(parents=True, exist_ok=True)

    df = pd.read_excel(excel, sheet_name=0, header=1, dtype=str)
    df = df.iloc[:, :4]
    df.columns = ["maMon", "tenMon", "khoa", "boMon"]
    for c in df.columns:
        df[c] = df[c].astype(str).str.strip()
    df = df[(df.maMon != "") & (df.maMon.str.lower() != "nan")]

    # Dedup theo maMon (giữ bản ghi đầu) + log
    dups = df[df.maMon.duplicated(keep=False)].sort_values("maMon")
    dropped = df[df.maMon.duplicated(keep="first")]
    if len(dups):
        print(f"[WARN] {df.maMon.duplicated().sum()} dòng trùng maMon (giữ bản đầu, bỏ bản sau):")
        for _, r in dups.iterrows():
            print(f"        {r.maMon:6s} | {r.tenMon} | {r.khoa} / {r.boMon}")
    df = df.drop_duplicates(subset="maMon", keep="first").reset_index(drop=True)

    # Danh mục môn học
    subjects = [
        {"maMon": r.maMon, "tenMon": r.tenMon, "khoa": r.khoa, "boMon": r.boMon}
        for _, r in df.iterrows()
    ]

    # Danh sách Bộ môn = distinct (Khoa giảng dạy, Bộ môn), bỏ Bộ môn "chưa gán"
    bomon_rows = []
    seen = set()
    per_khoa_seq = {}
    for _, r in df.iterrows():
        code = KHOA_NAME_TO_CODE.get(r.khoa)
        if code not in ACADEMIC_KHOA_CODES:
            continue
        if r.boMon in UNASSIGNED_BOMON or r.boMon == "":
            continue
        key = (code, r.boMon)
        if key in seen:
            continue
        seen.add(key)
        per_khoa_seq.setdefault(code, [])
        per_khoa_seq[code].append(r.boMon)

    for code, names in per_khoa_seq.items():
        for i, name in enumerate(sorted(names), start=1):
            bomon_rows.append({
                "code": f"BM_{code}_{strip_accents_slug(name)[:14]}",
                "name": name,
                "parentKhoaCode": code,
            })

    (out_dir / "mon_hoc_hvhc.json").write_text(
        json.dumps(subjects, ensure_ascii=False, indent=2), encoding="utf-8")
    (out_dir / "bo_mon_hvhc.json").write_text(
        json.dumps(bomon_rows, ensure_ascii=False, indent=2), encoding="utf-8")

    # Summary
    print(f"\n[OK] mon_hoc_hvhc.json : {len(subjects)} môn")
    print(f"[OK] bo_mon_hvhc.json  : {len(bomon_rows)} Bộ môn (distinct Khoa+Bộ môn)")
    mapped = sum(1 for s in subjects if KHOA_NAME_TO_CODE.get(s["khoa"]))
    print(f"     môn có Khoa map được Unit: {mapped}/{len(subjects)}")
    unmapped_khoa = sorted({s["khoa"] for s in subjects if not KHOA_NAME_TO_CODE.get(s["khoa"])})
    print(f"     Khoa KHÔNG map Unit (khoaId=null): {unmapped_khoa}")
    print("     Bộ môn theo Khoa:")
    for code in sorted(per_khoa_seq, key=lambda c: (len(c), c)):
        print(f"        {code:4s}: {len(set(per_khoa_seq[code]))} bộ môn")


if __name__ == "__main__":
    main()
