"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Building2,
  Users,
} from "lucide-react";
import { Member } from "@/lib/types";
import { formatToReadableDate } from "@/lib/utils";

interface EmployeeListSectionProps {
  members: Member[];
}
export function EmployeeListSection({ members }: EmployeeListSectionProps) {
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
              <p className="text-foreground mt-2 text-3xl font-bold">134</p>
              <p className="text-muted-foreground mt-1 text-xs">
                +2 from last month
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
              <p className="text-foreground mt-2 text-3xl font-bold">5</p>
              <p className="text-muted-foreground mt-1 text-xs">
                +2 from last month
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
              <p className="text-foreground mt-2 text-3xl font-bold">2.8</p>
              <p className="mt-1 text-xs text-green-600">
                +1.2% from last year
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
                Active Departments
              </p>
              <p className="text-foreground mt-2 text-3xl font-bold">7</p>
              <p className="text-muted-foreground mt-1 text-xs">
                -1 from last year
              </p>
            </div>
            <div className="rounded-lg bg-orange-100 p-3">
              <Building2 className="h-6 w-6 text-orange-600" />
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
                <Input placeholder="Search employee" className="w-64 pl-10" />
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
              Total Employee: 134 employees
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
              {members.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="bg-secondary h-9 w-9">
                        {/*<AvatarImage*/}
                        {/*  src={`/avatars/${employee.name.split(" ")[0].toLowerCase()}.jpg`}*/}
                        {/*/>*/}
                        <AvatarFallback className="bg-secondary h-9 w-9">
                          {employee.memberName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      {/*<span className="font-medium">{employee.memberName}</span>*/}
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
                      className={`${getStatusColor(employee.memberStatus ? "Active" : "Inactive")} border-0`}
                    >
                      {employee.memberStatus}
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
                        <DropdownMenuItem>
                          View Sales Performance
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Delete Employee
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
