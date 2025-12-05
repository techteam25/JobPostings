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

export function EmployeeListSection() {
  const employees = [
    {
      id: 1,
      name: "John Doe",
      department: "Marketing",
      position: "Manager",
      status: "Active",
      joinDate: "2023-03-15",
      selected: false,
    },
    {
      id: 2,
      name: "Maria Tan",
      department: "Finance",
      position: "Finance Manager",
      status: "On Leave",
      joinDate: "2021-07-20",
      selected: true,
    },
    {
      id: 3,
      name: "Charlie Brown",
      department: "Design",
      position: "UI/UX Designer",
      status: "Active",
      joinDate: "2022-11-10",
      selected: false,
    },
    {
      id: 4,
      name: "Dana White",
      department: "HR",
      position: "Recruiter",
      status: "Active",
      joinDate: "2020-05-12",
      selected: false,
    },
    {
      id: 5,
      name: "Ethan Hunt",
      department: "IT",
      position: "System Administrator",
      status: "Active",
      joinDate: "2020-01-20",
      selected: true,
    },
    {
      id: 6,
      name: "Fiona Glenanne",
      department: "Finance",
      position: "Accountant",
      status: "Inactive",
      joinDate: "2018-05-10",
      selected: false,
    },
    {
      id: 7,
      name: "George Lucas",
      department: "Marketing",
      position: "Content Strategist",
      status: "On Leave",
      joinDate: "2021-02-22",
      selected: false,
    },
    {
      id: 8,
      name: "Hannah Montana",
      department: "Operations",
      position: "Operations Coordinator",
      status: "Active",
      joinDate: "2020-09-18",
      selected: true,
    },
    {
      id: 9,
      name: "Ian Malcolm",
      department: "R&D",
      position: "Research Scientist",
      status: "Active",
      joinDate: "2019-12-01",
      selected: true,
    },
    {
      id: 10,
      name: "Jessica Alba",
      department: "Sales",
      position: "Sales Manager",
      status: "Active",
      joinDate: "2022-06-25",
      selected: false,
    },
  ];

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
        <h1 className="text-2xl font-semibold text-gray-900">Employee List</h1>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Employees
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">134</p>
              <p className="mt-1 text-xs text-gray-500">+2 from last month</p>
            </div>
            <div className="rounded-lg bg-blue-100 p-3">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="border-0 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                New Hires This Month
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">5</p>
              <p className="mt-1 text-xs text-gray-500">+2 from last month</p>
            </div>
            <div className="rounded-lg bg-emerald-100 p-3">
              <UserPlus className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </Card>

        <Card className="border-0 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Average Tenure (Years)
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">2.8</p>
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
              <p className="text-sm font-medium text-gray-600">
                Active Departments
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">7</p>
              <p className="mt-1 text-xs text-gray-500">-1 from last year</p>
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
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input placeholder="Search employee" className="w-64 pl-10" />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Bulk Import
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Directory
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Add a New Employee
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-gray-600">
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
                <TableHead>Department</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <Checkbox checked={employee.selected} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={`/avatars/${employee.name.split(" ")[0].toLowerCase()}.jpg`}
                        />
                        <AvatarFallback>
                          {employee.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{employee.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {employee.department}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {employee.position}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${getStatusColor(employee.status)} border-0`}
                    >
                      {employee.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {employee.joinDate}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Profile</DropdownMenuItem>
                        <DropdownMenuItem>Edit Details</DropdownMenuItem>
                        <DropdownMenuItem>
                          View Sales Performance
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
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
