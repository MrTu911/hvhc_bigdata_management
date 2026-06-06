/** Thể thức hành chính dùng chung (Giấy mời, Giấy giới thiệu) — khối Văn phòng/Tổ chức. */

import type { TemplateSpec } from '../types';
import { DOTS, HEADER_PH } from './shared';

export const GENERAL_SPECS: TemplateSpec[] = [
  {
    code: 'TPL_VP_GM',
    name: 'Giấy mời',
    description: 'Mẫu giấy mời dự họp/sự kiện (Nghị định 30/2020).',
    docType: 'GM',
    category: 'TONG_HOP',
    module: 'M02',
    moduleSource: ['M02'],
    entity: null,
    classification: 'INTERNAL',
    rbacCode: 'EXPORT_DATA',
    kyHieu: 'GM-HVHC',
    trichYeu: '',
    kinhGui: DOTS,
    body: [
      {
        paragraphs: [
          'Học viện Hậu cần trân trọng kính mời đồng chí tới dự:',
          `1. Nội dung: ${DOTS}`,
          '2. Thời gian: ......giờ......, ngày......tháng......năm......',
          '3. Địa điểm: ......',
          '4. Chủ trì: ......',
          '5. Thành phần: ......',
          'Đề nghị các đồng chí có mặt đúng thời gian./.',
        ],
      },
    ],
    chuKyChucVu: ['TL. GIÁM ĐỐC', 'TRƯỞNG PHÒNG HÀNH CHÍNH'],
    noiNhan: ['- Như kính gửi;'],
    luuBoPhan: 'PHC',
    placeholders: HEADER_PH,
  },
  {
    code: 'TPL_VP_GGT',
    name: 'Giấy giới thiệu',
    description: 'Mẫu giấy giới thiệu cán bộ đi liên hệ công tác (gắn dữ liệu nhân sự).',
    docType: 'GGT',
    category: 'TONG_HOP',
    module: 'M02',
    moduleSource: ['M02'],
    entity: 'personnel',
    classification: 'INTERNAL',
    rbacCode: 'EXPORT_DATA',
    kyHieu: 'GGT-HVHC',
    trichYeu: '',
    body: [
      {
        paragraphs: [
          'Học viện Hậu cần trân trọng giới thiệu:',
          'Đồng chí: {hoTen}          Cấp bậc: {capBac}',
          'Chức vụ: {chucVu}',
          'Đơn vị công tác: {donViCongTac}',
          `Được cử đến: ${DOTS}`,
          `Về việc: ${DOTS}`,
          'Đề nghị quý cơ quan tạo điều kiện giúp đỡ đồng chí hoàn thành nhiệm vụ.',
          'Giấy giới thiệu có giá trị đến hết ngày......tháng......năm......./.',
        ],
      },
    ],
    chuKyChucVu: ['TL. GIÁM ĐỐC', 'TRƯỞNG PHÒNG HÀNH CHÍNH'],
    noiNhan: ['- Như nội dung;'],
    luuBoPhan: 'PHC',
    placeholders: [...HEADER_PH, '{hoTen}', '{capBac}', '{chucVu}', '{donViCongTac}'],
  },
];
