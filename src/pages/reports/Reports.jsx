import { Link } from 'react-router-dom'
import { useReportStats, useDistributionTrends, useAttendanceTrends } from '@/hooks/useReports'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Users,
    Package,
    TrendingUp,
    GraduationCap,
    Heart,
    BarChart3,
    PieChart
} from 'lucide-react'
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart as RechartsPie,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts'

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

export function Reports() {
    const { data: stats, isLoading } = useReportStats()
    const { data: trends } = useDistributionTrends()
    const { data: attendanceTrends } = useAttendanceTrends()

    if (isLoading) return <LoadingSpinner />

    const genderData = stats?.genderStats ? Object.entries(stats.genderStats).map(([name, value]) => ({
        name,
        value
    })) : []

    const ageData = stats?.ageGroups ? Object.entries(stats.ageGroups).map(([name, value]) => ({
        name,
        value
    })) : []

    return (
        <div className="space-y-6">
            <PageHeader
                title="Reports & Analytics"
                description="Insights and statistics across all programs"
            />

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                    <TabsTrigger value="distributions">Distributions</TabsTrigger>
                    <TabsTrigger value="demographics">Demographics</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Beneficiaries</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.totalBeneficiaries || 0}</div>
                                <p className="text-xs text-muted-foreground">Registered individuals</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Food Recipients</CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.totalFoodRecipients || 0}</div>
                                <p className="text-xs text-muted-foreground">Hampers distributed</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.activeStudents || 0}</div>
                                <p className="text-xs text-muted-foreground">Educare program</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Women</CardTitle>
                                <Heart className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.activeWomen || 0}</div>
                                <p className="text-xs text-muted-foreground">Legacy program</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Gender Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RechartsPie>
                                        <Pie
                                            data={genderData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {genderData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </RechartsPie>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Age Groups</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={ageData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="value" fill="#3b82f6" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Distributions Tab */}
                <TabsContent value="distributions" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Food Distribution Trends</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={trends}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="period" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="recipients" fill="#10b981" name="Recipients" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Food Distributions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {stats?.foodDistributions?.slice(0, 5).map((dist) => (
                                        <div key={dist.id} className="flex justify-between items-center p-2 border rounded">
                                            <div>
                                                <div className="font-medium">{dist.quarter} {dist.year}</div>
                                                <div className="text-sm text-muted-foreground">{dist.distribution_location}</div>
                                            </div>
                                            <div className="text-sm font-medium">
                                                {dist.recipients?.[0]?.count || 0} recipients
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Emergency Relief Events</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {stats?.reliefDistributions?.slice(0, 5).map((dist) => (
                                        <div key={dist.id} className="flex justify-between items-center p-2 border rounded">
                                            <div>
                                                <div className="font-medium">{dist.reason || 'Emergency Relief'}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {new Date(dist.distribution_date).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="text-sm font-medium">
                                                {dist.recipients?.[0]?.count || 0} families
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Demographics Tab */}
                <TabsContent value="demographics" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <PieChart className="mr-2 h-5 w-5" />
                                    Gender Breakdown
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={350}>
                                    <RechartsPie>
                                        <Pie
                                            data={genderData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={true}
                                            label={({ name, value }) => `${name}: ${value}`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {genderData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </RechartsPie>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <BarChart3 className="mr-2 h-5 w-5" />
                                    Age Distribution
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={350}>
                                    <BarChart data={ageData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="value" fill="#8b5cf6" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Program Enrollment</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="p-4 border rounded-lg">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <GraduationCap className="h-5 w-5 text-blue-600" />
                                        <div className="font-medium">Educare Africa</div>
                                    </div>
                                    <div className="text-3xl font-bold">{stats?.activeStudents || 0}</div>
                                    <div className="text-sm text-muted-foreground">Active students</div>
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Heart className="h-5 w-5 text-pink-600" />
                                        <div className="font-medium">Legacy Women</div>
                                    </div>
                                    <div className="text-3xl font-bold">{stats?.activeWomen || 0}</div>
                                    <div className="text-sm text-muted-foreground">Active participants</div>
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Package className="h-5 w-5 text-green-600" />
                                        <div className="font-medium">Food Program</div>
                                    </div>
                                    <div className="text-3xl font-bold">{stats?.totalFoodRecipients || 0}</div>
                                    <div className="text-sm text-muted-foreground">Total recipients</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Attendance Tab */}
                <TabsContent value="attendance" className="space-y-6">
                    {/* Attendance Rate Cards */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Educare Attendance Rate</CardTitle>
                                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.educareAttendanceRate || 0}%</div>
                                <p className="text-xs text-muted-foreground">Last 30 days</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Legacy Women Attendance Rate</CardTitle>
                                <Heart className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.legacyAttendanceRate || 0}%</div>
                                <p className="text-xs text-muted-foreground">Last 30 days</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Attendance Trends Chart */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Attendance Trends (Last 7 Days)</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={attendanceTrends}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="educare"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        name="Educare Africa"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="legacy"
                                        stroke="#ec4899"
                                        strokeWidth={2}
                                        name="Legacy Women"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Note about filtering */}
                    <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                        <CardContent className="p-4">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                <strong>Note:</strong> For detailed monthly and termly attendance reports with advanced filtering,
                                visit the <Link to="/educare/attendance" className="underline font-medium">Educare Attendance</Link> or
                                <Link to="/legacy/attendance" className="underline font-medium"> Legacy Attendance</Link> pages.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
