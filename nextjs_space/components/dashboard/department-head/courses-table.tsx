
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  classesCount: number;
  studentsCount: number;
  instructors: string[];
}

interface CoursesTableProps {
  courses: Course[];
}

export function CoursesTable({ courses }: CoursesTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã môn</TableHead>
            <TableHead>Tên môn học</TableHead>
            <TableHead className="text-center">Tín chỉ</TableHead>
            <TableHead className="text-center">Số lớp</TableHead>
            <TableHead className="text-center">Sinh viên</TableHead>
            <TableHead>Giảng viên</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Không có dữ liệu môn học
              </TableCell>
            </TableRow>
          ) : (
            courses.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="font-medium">{course.code}</TableCell>
                <TableCell>{course.name}</TableCell>
                <TableCell className="text-center">{course.credits}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary">{course.classesCount}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline">{course.studentsCount}</Badge>
                </TableCell>
                <TableCell>
                  <div className="max-w-[200px] truncate">
                    {course.instructors.length > 0 
                      ? course.instructors.join(', ')
                      : 'Chưa phân công'}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
