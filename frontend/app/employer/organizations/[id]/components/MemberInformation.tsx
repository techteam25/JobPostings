"use client";

import { useMemo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Search,
  Filter,
  Upload,
  Download,
  Plus,
  UserPlus,
  Calendar,
  UserCheck,
  Users,
} from "lucide-react";
import { Member } from "@/lib/types";
import { formatToReadableDate } from "@/lib/utils";
import { InviteMemberDialog } from "./InviteMemberDialog";

interface EmployeeListSectionProps {
  members: Member[];
  organizationId: number;
}

export function EmployeeListSection({
  members,
  organizationId,
}: EmployeeListSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const filteredMembers = useMemo(() => {
    if (!searchTerm) return members;
    const lower = searchTerm.toLowerCase();
    return members.filter(
      (m) =>
        m.memberName.toLowerCase().includes(lower) ||
        m.memberEmail.toLowerCase().includes(lower),
    );
  }, [members, searchTerm]);

  const totalMembers = members.length;
  const activeMembers = members.filter((m) => m.isActive).length;

  const newHiresThisMonth = useMemo(() => {
    const now = new Date();
    return members.filter((m) => {
      const joinDate = new Date(m.createdAt);
      return (
        joinDate.getMonth() === now.getMonth() &&
        joinDate.getFullYear() === now.getFullYear()
      );
    }).length;
  }, [members]);

  const averageTenure = useMemo(() => {
    if (members.length === 0) return 0;
    const now = new Date();
    const totalYears = members.reduce((sum, m) => {
      const joinDate = new Date(m.createdAt);
      const years =
        (now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      return sum + years;
    }, 0);
    return (totalYears / members.length).toFixed(1);
  }, [members]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "On Leave":
        return "bg-amber-100 text-amber-800 hover:bg-amber-200";
      case "Inactive":
        return "bg-gray-100 text-gray-600 hover:bg-gray-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex h-full w-full flex-col p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-foreground text-2xl font-semibold">
          Employee List
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-secondary-foreground text-sm font-medium">
                Total Employees
              </p>
              <p className="text-foreground mt-2 text-3xl font-bold">
                {totalMembers}
              </p>
            </div>
            <div className="bg-primary/10 rounded-lg p-3">
              <Users className="text-primary h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="border-0 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-secondary-foreground text-sm font-medium">
                New Hires This Month
              </p>
              <p className="text-foreground mt-2 text-3xl font-bold">
                {newHiresThisMonth}
              </p>
            </div>
            <div className="rounded-lg bg-emerald-100 p-3">
              <UserPlus className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </Card>

        <Card className="border-0 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-secondary-foreground text-sm font-medium">
                Average Tenure (Years)
              </p>
              <p className="text-foreground mt-2 text-3xl font-bold">
                {averageTenure}
              </p>
            </div>
            <div className="rounded-lg bg-purple-100 p-3">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="border-0 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-secondary-foreground text-sm font-medium">
                Active Members
              </p>
              <p className="text-foreground mt-2 text-3xl font-bold">
                {activeMembers}
              </p>
            </div>
            <div className="rounded-lg bg-orange-100 p-3">
              <UserCheck className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Table Section */}
      <Card className="w-full border-0 shadow-sm">
        <div className="border-b p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
                <Input
                  placeholder="Search employee"
                  className="w-64 pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="hover:bg-primary cursor-pointer transition-colors [&_svg]:size-4"
              >
                <Filter className="mr-1" />
                Filter
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="hover:bg-primary cursor-pointer transition-colors [&_svg]:size-4"
              >
                <Upload className="mr-1" />
                Bulk Import
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="hover:bg-primary cursor-pointer transition-colors [&_svg]:size-4"
              >
                <Download className="mr-1" />
                Export Directory
              </Button>
              <Button
                size="sm"
                className="bg-primary/90 hover:bg-primary [&_svg]:size-4"
                onClick={() => setShowInviteDialog(true)}
              >
                <Plus className="mr-1" />
                Add a New Employee
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-secondary-foreground text-sm">
              Total Employee: {totalMembers} employees
            </span>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="bg-secondary h-9 w-9">
                        <AvatarFallback className="bg-secondary h-9 w-9">
                          {employee.memberName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </TableCell>
                  <TableCell className="text-secondary-foreground">
                    {employee.memberName}
                  </TableCell>
                  <TableCell className="text-secondary-foreground">
                    {employee.role}
                  </TableCell>
                  <TableCell className="text-secondary-foreground">
                    {employee.memberEmail}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${getStatusColor(employee.isActive ? "Active" : "Inactive")} border-0`}
                    >
                      {employee.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-secondary-foreground">
                    {formatToReadableDate(employee.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-primary hover:text-primary-foreground [&_svg]:size-4"
                        >
                          <MoreVertical />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Profile</DropdownMenuItem>
                        <DropdownMenuItem>Edit Details</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <InviteMemberDialog
        organizationId={organizationId}
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
      />
    </div>
  );
}
