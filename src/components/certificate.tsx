'use client';

import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, Medal } from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';

type CertificateProps = {
  studentName: string;
  courseName: string;
  instructorName: string;
  completionDate: string;
  verificationId: string;
};

export default function Certificate({
  studentName,
  courseName,
  instructorName,
  completionDate,
  verificationId,
}: CertificateProps) {
  const qrCodeRef = useRef<HTMLCanvasElement>(null);
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (qrCodeRef.current && verificationId) {
      const verificationUrl = `${window.location.origin}/verify/${verificationId}`;
      // FIX: Added type for 'error'
      QRCode.toCanvas(
        qrCodeRef.current,
        verificationUrl,
        { width: 100, margin: 1 },
        (error: Error | null | undefined) => {
          if (error) console.error(error);
        }
      );
    }
  }, [verificationId]);

  const handleDownload = async () => {
    if (!certificateRef.current) return;
    setIsDownloading(true);

    try {
      // The 'scale' error usually disappears after installing @types/html2canvas.
      // If it persists, we cast the options object as 'any' to bypass strict checking
      // because 'scale' is a valid runtime option.
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
      } as any);

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      const ratio = canvasWidth / canvasHeight;
      let newWidth = pdfWidth;
      let newHeight = newWidth / ratio;

      if (newHeight > pdfHeight) {
        newHeight = pdfHeight;
        newWidth = newHeight * ratio;
      }

      const x = (pdfWidth - newWidth) / 2;
      const y = (pdfHeight - newHeight) / 2;

      pdf.addImage(imgData, 'PNG', x, y, newWidth, newHeight);
      pdf.save(
        `certificate-${studentName.replace(/ /g, '_')}-${courseName.replace(
          / /g,
          '_'
        )}.pdf`
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto mb-8 text-right">
        <Button onClick={handleDownload} disabled={isDownloading}>
          <Download className="mr-2 h-4 w-4" />
          {isDownloading ? 'Downloading...' : 'Download Certificate'}
        </Button>
      </div>
      <div ref={certificateRef}>
        <div className="max-w-5xl mx-auto bg-white shadow-2xl rounded-lg overflow-hidden">
          <div className="border-t-8 border-accent"></div>
          <div className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="text-center md:text-left">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 font-headline">
                  Certificate of Completion
                </h1>
                <p className="text-gray-500 mt-1">Issued by EduMate</p>
              </div>
              <div className="mt-6 md:mt-0">
                <Medal className="h-20 w-20 text-accent" strokeWidth={1} />
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-lg text-gray-600">This certifies that</p>
              <p className="text-4xl sm:text-5xl font-bold text-accent my-4 font-serif">
                {studentName}
              </p>
              <p className="text-lg text-gray-600">
                has successfully completed the online course
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 mt-4">
                {courseName}
              </h2>
            </div>

            <div className="mt-12 border-t pt-8 flex flex-col md:flex-row items-center justify-between">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center flex-1">
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wider">
                    Instructor
                  </p>
                  <p className="text-lg font-semibold text-gray-700 mt-1">
                    {instructorName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wider">
                    Completion Date
                  </p>
                  <p className="text-lg font-semibold text-gray-700 mt-1">
                    {format(new Date(completionDate), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="mt-8 md:mt-0 md:ml-8">
                <canvas ref={qrCodeRef} />
              </div>
            </div>

            <div className="mt-12 text-center text-xs text-gray-400">
              <p>Scan the QR code to verify this certificate's authenticity.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
