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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppData } from "@/context/AppContext";
import { getAvatarColor } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function TeacherProfile() {
  const { data: user, loading, error } = useAppData("user");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">
              Error
            </CardTitle>
            <CardDescription className="text-center">
              {error?.message || "Usuario no encontrado"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => router.push("/login")}>
              Volver al login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto py-8">
      <div className="grid gap-6">
        {/* Profile Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-primary-800">
              Perfil del Profesor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={user.profilePicture || "/images/default-avatar.png"}
                  alt="Foto de perfil"
                />
                <AvatarFallback
                  className="text-white"
                  style={{ backgroundColor: getAvatarColor(user.username) }}
                >
                  {user.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{user.username}</h2>
                <p className="text-gray-600">Profesor</p>
                <div className="mt-2 flex gap-2">
                  <Badge variant="secondary">Experiencia: 5 años</Badge>
                  <Badge variant="secondary">Cursos: 12</Badge>
                </div>
              </div>
              <Button variant="outline">Editar Perfil</Button>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-primary-800">
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input id="email" value={user.email} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" value="+34 123 456 789" readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación</Label>
                <Input id="location" value="Madrid, España" readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialties">Especialidades</Label>
                <Input id="specialties" value="Matemáticas, Física" readOnly />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teaching Experience */}
        <Card>
          <CardHeader>
            <CardTitle className="text-primary-800">
              Experiencia Docente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="font-semibold">
                  Universidad Complutense de Madrid
                </h3>
                <p className="text-sm text-gray-600">2018 - Presente</p>
                <p className="mt-2">Profesor de Matemáticas Avanzadas</p>
              </div>
              <div className="border-b pb-4">
                <h3 className="font-semibold">
                  Instituto de Educación Secundaria
                </h3>
                <p className="text-sm text-gray-600">2015 - 2018</p>
                <p className="mt-2">Profesor de Matemáticas y Física</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Courses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-primary-800">Cursos Actuales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="font-semibold">Cálculo Avanzado</h3>
                  <p className="text-sm text-gray-600">30 estudiantes</p>
                </div>
                <Badge className="bg-accent-500 text-white">En curso</Badge>
              </div>
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="font-semibold">Física Cuántica</h3>
                  <p className="text-sm text-gray-600">25 estudiantes</p>
                </div>
                <Badge className="bg-accent-500 text-white">En curso</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
