import Image from 'next/image';

/**
 * Dải banner định danh Học viện Hậu cần đặt trên cùng khu dashboard.
 *
 * Dùng ảnh thiết kế sẵn (public/images/banner_hvhc.png — phù hiệu + tên VI/EN +
 * huân chương + ảnh Học viện) thay vì render từng phần bằng code, để khớp với
 * bản thiết kế giao diện v4.2.
 *
 * Hiển thị ĐÚNG tỉ lệ gốc (w-full + h-auto) để không bị méo/cắt: rộng tới đâu cao
 * theo tỉ lệ tới đó. Chặn trần `max-h` cho màn siêu rộng (khi đó mới crop nhẹ
 * trên/dưới). Chỉ hiện ở desktop (lg+) — trên mobile dải 7.76:1 quá thấp để đọc,
 * nhận diện dồn vào thanh điều hướng.
 */
export function InstitutionalBanner() {
  return (
    <div className="hidden lg:block w-full bg-[#f7e8c8]">
      <Image
        src="/images/banner_hvhc.png"
        alt="Học viện Hậu cần — Military Academy of Logistics"
        width={1320}
        height={170}
        priority
        sizes="100vw"
        className="w-full h-auto max-h-[228px] object-cover object-center"
      />
    </div>
  );
}
