import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await apiRequest("PATCH", `/api/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, active }: { userId: string; active: boolean }) => {
      await apiRequest("PATCH", `/api/users/${userId}/status`, { active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User status updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      user.companyName?.toLowerCase().includes(searchLower)
    );
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'procurement':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'supplier':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      default:
        return '';
    }
  };

  const getInitials = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.companyName) {
      return user.companyName.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-medium text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage user roles and permissions
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-semibold">All Users</CardTitle>
                <CardDescription>
                  {users.length} {users.length === 1 ? 'user' : 'users'} registered
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-users"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No users found</p>
                {searchTerm && (
                  <p className="text-sm mt-2">Try adjusting your search term</p>
                )}
              </div>
            ) : (
              <div className="border border-border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12"></TableHead>
                      <TableHead className="font-semibold uppercase text-xs">User</TableHead>
                      <TableHead className="font-semibold uppercase text-xs">Email</TableHead>
                      <TableHead className="font-semibold uppercase text-xs">Company</TableHead>
                      <TableHead className="font-semibold uppercase text-xs">Role</TableHead>
                      <TableHead className="font-semibold uppercase text-xs">Status</TableHead>
                      <TableHead className="font-semibold uppercase text-xs">Joined</TableHead>
                      <TableHead className="font-semibold uppercase text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className="hover-elevate">
                        <TableCell>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.profileImageUrl || undefined} />
                            <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                              {getInitials(user)}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.companyName || 'Unnamed User'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.email || 'N/A'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.companyName || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${getRoleBadgeColor(user.role)} uppercase text-xs font-semibold`}
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={user.active ? "default" : "outline"}
                            onClick={() =>
                              updateStatusMutation.mutate({ userId: user.id, active: !user.active })
                            }
                            disabled={updateStatusMutation.isPending}
                            data-testid={`button-toggle-status-${user.id}`}
                          >
                            {user.active ? 'Active' : 'Inactive'}
                          </Button>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground font-mono">
                          {user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Select
                            value={user.role}
                            onValueChange={(role) =>
                              updateRoleMutation.mutate({ userId: user.id, role })
                            }
                            disabled={updateRoleMutation.isPending}
                          >
                            <SelectTrigger className="w-32 ml-auto" data-testid={`select-role-${user.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="procurement">Procurement</SelectItem>
                              <SelectItem value="supplier">Supplier</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
