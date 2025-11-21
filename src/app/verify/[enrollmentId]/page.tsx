import { notFound } from 'next/navigation';
import dbConnect from '@/lib/mongodb';
import Enrollment from '@/models/Enrollment';
import User from '@/models/User';
import Course from '@/models/Course';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

async function getVerificationData(enrollmentId: string) {
    try {
        await dbConnect();

        const enrollment = await Enrollment.findById(enrollmentId)
            .populate({ path: 'user', model: User, select: 'name' })
            .populate({ path: 'course', model: Course, select: 'title' })
            .lean();

        if (!enrollment || !(enrollment.user as any)?.name || !(enrollment.course as any)?.title) {
            return { isValid: false, data: null };
        }
        
        // Ensure the course is marked as completed by an admin
        const course = await Course.findById(enrollment.course._id).lean();
        if(course?.status !== 'completed') {
            return { isValid: false, data: { message: "This course has not been officially completed." } };
        }

        return {
            isValid: true,
            data: {
                studentName: (enrollment.user as any).name,
                courseName: (enrollment.course as any).title,
                completionDate: enrollment.updatedAt, // Using enrollment update time as a proxy for completion
            }
        };

    } catch (error) {
        console.error("Certificate verification error:", error);
        return { isValid: false, data: null };
    }
}

export default async function VerificationPage({ params }: { params: { enrollmentId: string } }) {
    const { isValid, data } = await getVerificationData(params.enrollmentId);

    return (
        <div className="container flex items-center justify-center min-h-screen py-12">
            <Card className="max-w-lg w-full">
                <CardHeader className="text-center">
                    {isValid ? (
                        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                    ) : (
                        <XCircle className="mx-auto h-16 w-16 text-destructive" />
                    )}
                    <CardTitle className="mt-4">{isValid ? 'Certificate Verified' : 'Verification Failed'}</CardTitle>
                </CardHeader>
                <CardContent>
                    {isValid && data ? (
                        <div className="space-y-4 text-center">
                            <p className="text-muted-foreground">This certificate is authentic.</p>
                            <div className="p-4 border rounded-md bg-muted/50">
                                 <p className="text-sm font-medium text-muted-foreground">Awarded to</p>
                                 <p className="text-2xl font-semibold">{data.studentName}</p>
                            </div>
                             <div className="p-4 border rounded-md bg-muted/50">
                                 <p className="text-sm font-medium text-muted-foreground">For completing the course</p>
                                 <p className="text-xl font-semibold">{data.courseName}</p>
                            </div>
                             <div className="p-4 border rounded-md bg-muted/50">
                                 <p className="text-sm font-medium text-muted-foreground">On</p>
                                 <p className="text-lg font-semibold">{format(new Date(data.completionDate), 'MMMM d, yyyy')}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground">
                          {data?.message || "This certificate could not be found or is no longer valid."}
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
