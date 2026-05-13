"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentTable } from "@/components/students/student-table";
import { StudentForm } from "@/components/students/student-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface Props {
  activeStudents: any[];
  graduatedStudents: any[];
}

export function StudentListTabs({ activeStudents, graduatedStudents }: Props) {
  const [showForm, setShowForm] = useState(false);
  return (
    <>
      <div className="mb-4">
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" />添加学生
        </Button>
      </div>
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">在读 ({activeStudents.length})</TabsTrigger>
          <TabsTrigger value="graduated">已毕业 ({graduatedStudents.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4">
          <StudentTable students={activeStudents} />
        </TabsContent>
        <TabsContent value="graduated" className="mt-4">
          <StudentTable students={graduatedStudents} />
        </TabsContent>
      </Tabs>
      <StudentForm open={showForm} onOpenChange={setShowForm} student={null} />
    </>
  );
}
