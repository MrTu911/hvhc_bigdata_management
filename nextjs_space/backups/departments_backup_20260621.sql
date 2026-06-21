--
-- PostgreSQL database dump
--

\restrict rcTBLsrG9CVMLPa1dbFDpKen6Qy35Pq8AcaSpxWZHn5SfgV6I3KOAxuKT6LBmaQ

-- Dumped from database version 16.14 (Ubuntu 16.14-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.14 (Ubuntu 16.14-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: ductuking
--

INSERT INTO public.departments (id, code, name, "shortName", "fullName", "parentId", level, description, address, phone, email, latitude, longitude, "sortOrder", "isActive", "createdAt", "updatedAt") VALUES ('cmn8hmu3n00008i5gw8djvl8p', 'HVHC', 'Học viện Hậu cần', 'HVHC', 'Học viện Hậu cần - Bộ Quốc phòng', NULL, 1, NULL, 'Km 10, Đường Hồ Chí Minh, Hà Nội', '024-3835-0000', 'info@hvhc.edu.vn', 21.0285, 105.8542, 1, true, '2026-03-27 05:55:52.164', '2026-04-20 08:41:05.543');
INSERT INTO public.departments (id, code, name, "shortName", "fullName", "parentId", level, description, address, phone, email, latitude, longitude, "sortOrder", "isActive", "createdAt", "updatedAt") VALUES ('cmn8hmu3r00018i5guptllrsq', 'KHCL', 'Khoa Hậu cần', 'Khoa HC', 'Khoa Hậu cần quân sự', NULL, 2, NULL, NULL, NULL, NULL, NULL, NULL, 2, true, '2026-03-27 05:55:52.167', '2026-04-20 08:41:05.546');
INSERT INTO public.departments (id, code, name, "shortName", "fullName", "parentId", level, description, address, phone, email, latitude, longitude, "sortOrder", "isActive", "createdAt", "updatedAt") VALUES ('cmn8hmu3t00028i5g5ap5m538', 'KVHK', 'Khoa Vận tải - Hóa chất', 'Khoa VT-HC', 'Khoa Vận tải và Hóa chất', NULL, 2, NULL, NULL, NULL, NULL, NULL, NULL, 3, true, '2026-03-27 05:55:52.169', '2026-04-20 08:41:05.547');
INSERT INTO public.departments (id, code, name, "shortName", "fullName", "parentId", level, description, address, phone, email, latitude, longitude, "sortOrder", "isActive", "createdAt", "updatedAt") VALUES ('cmn8hmu3u00038i5gzsj3t4s7', 'KTXD', 'Khoa Kỹ thuật Xây dựng', 'Khoa KTXD', 'Khoa Kỹ thuật Xây dựng', NULL, 2, NULL, NULL, NULL, NULL, NULL, NULL, 4, true, '2026-03-27 05:55:52.17', '2026-04-20 08:41:05.548');
INSERT INTO public.departments (id, code, name, "shortName", "fullName", "parentId", level, description, address, phone, email, latitude, longitude, "sortOrder", "isActive", "createdAt", "updatedAt") VALUES ('cmn8hmu3v00048i5gh3fpjh55', 'KTC', 'Khoa Tài chính', 'Khoa TC', 'Khoa Tài chính quân sự', NULL, 2, NULL, NULL, NULL, NULL, NULL, NULL, 5, true, '2026-03-27 05:55:52.171', '2026-04-20 08:41:05.549');
INSERT INTO public.departments (id, code, name, "shortName", "fullName", "parentId", level, description, address, phone, email, latitude, longitude, "sortOrder", "isActive", "createdAt", "updatedAt") VALUES ('cmn8hmu3w00058i5gz3j0avmr', 'KCNTT', 'Khoa Công nghệ thông tin', 'Khoa CNTT', 'Khoa Công nghệ thông tin và Truyền thông', NULL, 2, NULL, NULL, NULL, NULL, NULL, NULL, 6, true, '2026-03-27 05:55:52.173', '2026-04-20 08:41:05.55');


--
-- PostgreSQL database dump complete
--

\unrestrict rcTBLsrG9CVMLPa1dbFDpKen6Qy35Pq8AcaSpxWZHn5SfgV6I3KOAxuKT6LBmaQ

