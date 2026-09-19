import { AuthProvider } from "../context/AuthContext";
import "./globals.css";

export const metadata = {
  title: "IELTS Practicing | Core Peer Module Terminal",
  description: "Connect instantly with peer learners worldwide to practice speaking.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#0F172A] text-[#F8FAFC]">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
