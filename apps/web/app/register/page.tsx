import React, { Suspense } from "react";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { Card, CardContent } from "@/components/ui/Card";
import { Utensils } from "lucide-react";
import { LoadingState } from "@/components/feedback/LoadingState";

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] py-12 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center mx-auto shadow-md">
            <Utensils className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Join Orderly
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Create an account to start ordering food from your favorite spots
          </p>
        </div>

        <Card className="shadow-lg border-slate-200 dark:border-slate-800">
          <CardContent className="pt-6">
            <Suspense fallback={<LoadingState message="Loading form..." />}>
              <RegisterForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
