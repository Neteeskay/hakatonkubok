"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService, type VolunteerRegisterRequest } from "@/shared/api";
import {
  getVolunteerRegisterErrorMessage,
  volunteerRegisterRedirect,
  volunteerRegisterSuccessMessage
} from "@/widgets/auth/model/volunteer-registration";

export function useVolunteerRegistration({
  redirectTo = volunteerRegisterRedirect,
  successMessage = volunteerRegisterSuccessMessage
}: {
  redirectTo?: string;
  successMessage?: string;
} = {}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function clearFeedback() {
    setError(null);
    setSuccess(null);
  }

  async function registerVolunteer(payload: VolunteerRegisterRequest) {
    if (submitting) return;

    setSubmitting(true);
    clearFeedback();

    try {
      await authService.registerVolunteer(payload);
      setSuccess(successMessage);
      router.push(redirectTo);
    } catch (submitError) {
      setError(getVolunteerRegisterErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  return {
    clearFeedback,
    error,
    registerVolunteer,
    submitting,
    success
  };
}
