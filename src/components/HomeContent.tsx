"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

// Función auxiliar para generar colores de avatar
function getAvatarColor(letter: string) {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEEAD",
    "#D4A5A5",
    "#9B59B6",
    "#3498DB",
  ];
  const index = letter.charCodeAt(0) % colors.length;
  return colors[index];
}

export default function HomeContent() {
  const t = useTranslations("home");

  // Mock data for featured teachers and courses
  const featuredTeachers = [
    {
      id: 1,
      name: "Dr. María García",
      specialty: "Matemáticas",
      experience: "8 años",
      courses: 15,
      profilePicture: "/placeholder-avatar.jpg",
    },
    {
      id: 2,
      name: "Prof. Juan Martínez",
      specialty: "Física",
      experience: "6 años",
      courses: 12,
      profilePicture: "/placeholder-avatar.jpg",
    },
    {
      id: 3,
      name: "Dra. Ana López",
      specialty: "Química",
      experience: "10 años",
      courses: 18,
      profilePicture: "/placeholder-avatar.jpg",
    },
  ];

  const popularCourses = [
    {
      id: 1,
      title: "Cálculo Avanzado",
      description: "Aprende cálculo diferencial e integral de manera práctica",
      teacher: "Dr. María García",
      students: 45,
      level: "Avanzado",
    },
    {
      id: 2,
      title: "Física Cuántica",
      description:
        "Introducción a los conceptos fundamentales de la física cuántica",
      teacher: "Prof. Juan Martínez",
      students: 38,
      level: "Intermedio",
    },
    {
      id: 3,
      title: "Química Orgánica",
      description: "Compuestos orgánicos y sus reacciones",
      teacher: "Dra. Ana López",
      students: 42,
      level: "Avanzado",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gray-100 bg-[url('/images/bg.webp')] bg-cover bg-center bg-no-repeat text-white">
        <div className="px-4 sm:px-6 lg:px-8 h-full bg-black/15 rounded-lg py-20">
          <div className="max-w-7xl mx-auto text-center p-8 rounded-lg">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-shadow-lg">
              {t("heroTitle")}
            </h1>
            <p className="text-xl mb-8 text-shadow-lg">
              {t("heroDescription")}
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/register">
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-secondary-700"
                >
                  {t("startNow")}
                </Button>
              </Link>
              <Link href="/tutors">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-primary-100 text-secondary-700"
                >
                  {t("findTutors")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Teachers Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t("featuredTeachersTitle")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredTeachers.map((teacher) => (
              <Card
                key={teacher.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage
                        src={teacher.profilePicture}
                        alt={teacher.name}
                      />
                      <AvatarFallback
                        className="text-white"
                        style={{
                          backgroundColor: getAvatarColor(teacher.name[0]),
                        }}
                      >
                        {teacher.name[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{teacher.name}</h3>
                      <p className="text-gray-600">{teacher.specialty}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Badge variant="secondary">{teacher.experience}</Badge>
                    <Badge variant="secondary">
                      {teacher.courses} {t("courses")}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Courses Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t("popularCoursesTitle")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {popularCourses.map((course) => (
              <Card
                key={course.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <CardTitle>{course.title}</CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      {t("teacher")}: {course.teacher}
                    </p>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">{course.level}</Badge>
                      <span className="text-sm text-gray-600">
                        {course.students} {t("students")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t("whyChooseUsTitle")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="font-semibold text-lg mb-2">
                    {t("expertTeachers")}
                  </h3>
                  <p className="text-gray-600">
                    {t("expertTeachersDescription")}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="font-semibold text-lg mb-2">
                    {t("customClasses")}
                  </h3>
                  <p className="text-gray-600">
                    {t("customClassesDescription")}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="font-semibold text-lg mb-2">
                    {t("totalFlexibility")}
                  </h3>
                  <p className="text-gray-600">
                    {t("totalFlexibilityDescription")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">{t("ready")}</h2>
          <p className="text-xl text-gray-600 mb-8">{t("joinCommunity")}</p>
          <Link href="/register">
            <Button size="lg">{t("registerNow")}</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold">Free Time Classes</h3>
              <p className="text-gray-400">{t("companyDescription")}</p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">{t("quickLinks")}</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/tutors"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {t("findTutors")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/courses"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {t("availableCourses")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/become-tutor"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {t("becomeTutor")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {t("aboutUs")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-lg font-semibold mb-4">{t("contact")}</h4>
              <ul className="space-y-2 text-gray-400">
                <li>{t("email")}</li>
                <li>{t("phone")}</li>
                <li>{t("address")}</li>
                <li>{t("schedule")}</li>
              </ul>
            </div>

            {/* Social Media */}
            <div>
              <h4 className="text-lg font-semibold mb-4">{t("followUs")}</h4>
              <div className="flex space-x-4">
                <Link
                  href="https://facebook.com"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Facebook className="h-6 w-6" />
                </Link>
                <Link
                  href="https://instagram.com"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Instagram className="h-6 w-6" />
                </Link>
                <Link
                  href="https://twitter.com"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Twitter className="h-6 w-6" />
                </Link>
                <Link
                  href="https://youtube.com"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Youtube className="h-6 w-6" />
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>
              &copy; {new Date().getFullYear()} Free Time Classes.{" "}
              {t("allRightsReserved")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
