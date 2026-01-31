import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMyRestaurant } from '@/hooks/useRestaurants';
import { useRestaurantTables, useShifts, useStaffAssignments } from '@/hooks/useStaff';
import { useStaffInvitations, useRestaurantStaffMembers } from '@/hooks/useRestaurantStaff';
import { StaffInviteDialog } from '@/components/staff/StaffInviteDialog';
import { StaffList } from '@/components/staff/StaffList';
import { InvitationsList } from '@/components/staff/InvitationsList';
import { TableManagement } from '@/components/tables/TableManagement';
import { format } from 'date-fns';
import { Users, Table as TableIcon, Mail, Calendar, Clock, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function RestaurantStaffManagement() {
  const { data: restaurant, isLoading: restaurantLoading } = useMyRestaurant();
  const { data: tables, isLoading: tablesLoading } = useRestaurantTables(restaurant?.id);
  const { data: shifts, isLoading: shiftsLoading } = useShifts(restaurant?.id);
  const { data: assignments } = useStaffAssignments(restaurant?.id, format(new Date(), 'yyyy-MM-dd'));
  const { data: invitations, isLoading: invitationsLoading } = useStaffInvitations(restaurant?.id);
  const { data: staff, isLoading: staffLoading } = useRestaurantStaffMembers(restaurant?.id);

  if (restaurantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingInvitationsCount = invitations?.filter(i => i.status === 'pending').length || 0;

  const headerActions = restaurant ? <StaffInviteDialog restaurantId={restaurant.id} /> : null;

  return (
    <DashboardLayout
      role="restaurant"
      title="Staff Management"
      subtitle="Manage your team and tables"
      headerActions={headerActions}
    >
      <Tabs defaultValue="staff" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="staff" className="gap-1.5 text-xs sm:text-sm">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Staff</span>
          </TabsTrigger>
          <TabsTrigger value="invitations" className="gap-1.5 text-xs sm:text-sm">
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">Invitations</span>
            {pendingInvitationsCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {pendingInvitationsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="tables" className="gap-1.5 text-xs sm:text-sm">
            <TableIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Tables</span>
          </TabsTrigger>
          <TabsTrigger value="shifts" className="gap-1.5 text-xs sm:text-sm">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Shifts</span>
          </TabsTrigger>
          <TabsTrigger value="assignments" className="gap-1.5 text-xs sm:text-sm">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Today</span>
          </TabsTrigger>
        </TabsList>

        {/* Staff Tab */}
        <TabsContent value="staff">
          <StaffList 
            staff={staff || []} 
            restaurantId={restaurant?.id || ''} 
            isLoading={staffLoading} 
          />
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations">
          <InvitationsList 
            invitations={invitations || []} 
            restaurantId={restaurant?.id || ''} 
            isLoading={invitationsLoading} 
          />
        </TabsContent>

        {/* Tables Tab */}
        <TabsContent value="tables">
          <TableManagement 
            tables={tables || []} 
            staff={staff || []}
            restaurantId={restaurant?.id || ''} 
            isLoading={tablesLoading} 
          />
        </TabsContent>

        {/* Shifts Tab */}
        <TabsContent value="shifts">
          {shiftsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : shifts && shifts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shifts.map((shift) => (
                <Card key={shift.id} variant="glass">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{shift.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {shift.start_time} - {shift.end_time}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-serif font-semibold mb-2">No shifts configured</h3>
              <p className="text-muted-foreground">
                Create shifts to organize staff schedules
              </p>
            </div>
          )}
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments">
          <Card variant="premium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Today's Assignments
              </CardTitle>
              <CardDescription>
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignments && assignments.length > 0 ? (
                <div className="space-y-3">
                  {assignments.map((assignment) => {
                    const table = tables?.find(t => t.id === assignment.table_id);
                    const staffMember = staff?.find(s => s.user_id === assignment.staff_user_id);
                    return (
                      <div key={assignment.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                            {table?.table_number || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium">Table {table?.table_number}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {staffMember?.profiles?.full_name || staffMember?.profiles?.email || 'Staff member'}
                            </p>
                          </div>
                        </div>
                        <Badge>Active</Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No assignments for today. Assign staff to tables in the Tables tab.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
