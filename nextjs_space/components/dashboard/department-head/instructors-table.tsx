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
import { Progress } from '@/components/ui/progress';

interface Instructor {
  id: string;
  name: string;
  email: string;
  classesCount: number;
  studentsCount: number;
  teachingHours: number;
  researchProjects: number;
}

interface InstructorsTableProps {
  instructors: Instructor[];
}

export function InstructorsTable({ instructors }: InstructorsTableProps) {
  const STANDARD_HOURS = 180;

  const getWorkloadPercentage = (hours: number) => {
    return (hours / STANDARD_HOURS) * 100;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Giảng viên</TableHead>
            <TableHead className="text-center">Số lớp</TableHead>
            <TableHead className="text-center">Sinh viên</TableHead>
            <TableHead className="text-center">Số tiết</TableHead>
            <TableHead className="text-center">Định mức</TableHead>
            <TableHead className="text-center">Nghiên cứu</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {instructors.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Không có dữ liệu giảng viên
              </TableCell>
            </TableRow>
          ) : (
            instructors.map((instructor) => {
              const workloadPercentage = getWorkloadPercentage(instructor.teachingHours);
              const badgeVariant = instructor.researchProjects > 0 ? 'default' : 'outline';

              return (
                <TableRow key={instructor.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{instructor.name}</div>
                      <div className="text-sm text-muted-foreground">{instructor.email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{instructor.classesCount}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {instructor.studentsCount}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-medium">{instructor.teachingHours}</span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{Math.round(workloadPercentage)}%</span>
                        <span className="text-muted-foreground">
                          {instructor.teachingHours}/{STANDARD_HOURS}
                        </span>
                      </div>
                      <Progress value={workloadPercentage} className="h-2" />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={badgeVariant as any}>
                      {instructor.researchProjects}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}