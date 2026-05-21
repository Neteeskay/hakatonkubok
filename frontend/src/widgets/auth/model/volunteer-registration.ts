import { ApiError, getApiErrorMessage, type VolunteerRegisterRequest } from "@/shared/api";

export interface VolunteerRegistrationFormState {
  city: string;
  confirm: string;
  department?: string;
  email: string;
  employeeId?: string;
  firstName: string;
  lastName: string;
  password: string;
  phone: string;
  position?: string;
}

export interface VolunteerRegistrationValidationInput {
  agree: boolean;
  form: VolunteerRegistrationFormState;
  interests: string[];
}

export const volunteerRegisterRedirect = "/volunteer/profile";
export const volunteerRegisterSuccessMessage = "Профиль создан. Открываем кабинет.";

export const defaultVolunteerRegistrationForm: VolunteerRegistrationFormState = {
  firstName: "Анна",
  lastName: "Смирнова",
  email: "anna.smirnova@stoloto.local",
  password: "",
  confirm: "",
  city: "Москва",
  phone: "+7 999 123-45-67"
};

export const volunteerOnboardingRegistrationForm: VolunteerRegistrationFormState = {
  ...defaultVolunteerRegistrationForm,
  employeeId: "EMP-1002",
  department: "Маркетинг",
  position: "Контент-менеджер"
};

export function isEmailValid(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function getVolunteerRegistrationFieldErrors(form: VolunteerRegistrationFormState) {
  return {
    confirm: form.confirm && form.confirm !== form.password ? "Пароли не совпадают." : null,
    email: form.email && !isEmailValid(form.email) ? "Введите email в формате name@example.ru." : null,
    password: form.password && form.password.length < 6 ? "Пароль должен быть не короче 6 символов." : null,
    phone: form.phone && form.phone.replace(/\D/g, "").length < 10 ? "Телефон должен содержать минимум 10 цифр." : null
  };
}

export function isVolunteerRegistrationValid({
  agree,
  form,
  interests
}: VolunteerRegistrationValidationInput) {
  return (
    form.firstName.trim().length > 1 &&
    form.lastName.trim().length > 1 &&
    isEmailValid(form.email) &&
    form.password.length >= 6 &&
    form.password === form.confirm &&
    form.city.trim().length > 1 &&
    form.phone.trim().length >= 7 &&
    interests.length > 0 &&
    agree
  );
}

export function buildVolunteerRegisterRequest({
  form,
  interests,
  skills
}: {
  form: VolunteerRegistrationFormState;
  interests: string[];
  skills: string[];
}): VolunteerRegisterRequest {
  const employeeId = form.employeeId?.trim();
  const department = form.department?.trim();
  const position = form.position?.trim();

  return {
    city: form.city.trim() || null,
    department: department || null,
    email: form.email.trim().toLowerCase(),
    employee_id: employeeId || null,
    full_name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
    interests,
    password: form.password,
    phone: form.phone.trim() || null,
    position: position || null,
    skills
  };
}

export function getVolunteerRegisterErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return "Email не найден в базе сотрудников. Используйте корпоративную почту, добавленную администратором.";
    }

    if (error.status === 409 && error.message === "email already exists") {
      return "Пользователь с таким email уже зарегистрирован.";
    }

    if (error.status === 409 && error.message === "employee_id already exists") {
      return "Сотрудник с таким employee ID уже зарегистрирован.";
    }
  }

  return getApiErrorMessage(error);
}
