"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/UserContext";
import { DELETE_LESSON_MUTATION, LESSON_QUERY } from "@/graphql/lessons";
import { useLocale, useTranslations } from "@/i18n/translations";
import { useMutation, useQuery } from "@apollo/client";
import { DateSelectArg, DatesSetArg, EventClickArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { Mail } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  backgroundColor: string;
}

export default function AvailabilityCalendar() {
  const locale = useLocale();
  const t = useTranslations("teacherProfile");
  const [events, setEvents] = useState<Event[]>([]);
  const { lessons, refreshLessons } = useApp();
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const { data: lessonData, loading: lessonLoading } = useQuery(LESSON_QUERY, {
    variables: { id: selectedLessonId },
    skip: !selectedLessonId,
  });
  const { user } = useAuth();
  const [deleteLesson, { loading: deleteLoading }] = useMutation(
    DELETE_LESSON_MUTATION
  );

  const handleDatesSet = (arg: DatesSetArg) => {
    refreshLessons(
      {
        start: arg.start,
        end: arg.end,
      },
      "available"
    );
  };

  useEffect(() => {
    if (lessons.data) {
      const lessonEvents = lessons.data.map((lesson) => ({
        id: lesson.id,
        title: `${lesson.subject.name}\n - ${lesson.priceAmount} ${lesson.priceCurrency}`,
        start: new Date(lesson.scheduledDateTime),
        end: new Date(
          new Date(lesson.scheduledDateTime).getTime() +
            lesson.durationMinutes * 60000
        ),
        backgroundColor: "#4CAF50",
      }));
      setEvents(lessonEvents);
    }
  }, [lessons.data]);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const title = prompt(t("enterEventTitle"));
    const calendarApi = selectInfo.view.calendar;

    calendarApi.unselect();

    if (title) {
      setEvents([
        ...events,
        {
          id: createEventId(),
          title,
          start: selectInfo.start,
          end: selectInfo.end,
          backgroundColor: "#4CAF50",
        },
      ]);
    }
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    setSelectedLessonId(clickInfo.event.id);
  };

  const handleCloseDialog = () => {
    setSelectedLessonId(null);
  };

  const createEventId = () => {
    return String(Math.random()).replace(/\D/g, "");
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedLessonId) return;

    try {
      const { data } = await deleteLesson({
        variables: { id: selectedLessonId },
      });

      if (data?.deleteLesson?.success) {
        // Remove the event from the calendar
        setEvents(events.filter((event) => event.id !== selectedLessonId));
        // Close both dialogs
        handleCloseDialog();
        setShowDeleteConfirmation(false);
        // Refresh the lessons list
        refreshLessons(
          {
            start: new Date(),
            end: new Date(new Date().setMonth(new Date().getMonth() + 1)),
          },
          "available"
        );
      }
    } catch (error) {
      console.error("Error deleting lesson:", error);
      // You might want to show an error message to the user here
    }
  };

  console.log("lessonData.lesson", lessonData?.lesson);
  console.log("user", user);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary-800">{t("availability")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-2">
          <Button variant="ghost" className="btn-primary" onClick={() => {}}>
            {t("addAvailability")}
          </Button>
        </div>
        <div className="h-[600px]">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            buttonText={{
              today: t("calendar.today"),
              month: t("calendar.month"),
              week: t("calendar.week"),
              day: t("calendar.day"),
              list: t("calendar.list"),
              prev: t("calendar.previous"),
              next: t("calendar.next"),
              more: t("calendar.more"),
            }}
            noEventsText={t("calendar.noEvents")}
            initialView="timeGridWeek"
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            events={events}
            select={handleDateSelect}
            eventClick={handleEventClick}
            datesSet={handleDatesSet}
            slotMinTime="08:00:00"
            slotMaxTime="20:00:00"
            allDaySlot={false}
            height="100%"
            locale={locale}
            slotDuration="01:00:00"
            expandRows={true}
            stickyHeaderDates={true}
            nowIndicator={true}
            businessHours={{
              daysOfWeek: [1, 2, 3, 4, 5],
              startTime: "08:00",
              endTime: "20:00",
            }}
          />
        </div>
      </CardContent>
      <Dialog open={!!selectedLessonId} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{t("lessonDetails")}</DialogTitle>
          </DialogHeader>
          {lessonLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : lessonData?.lesson ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-primary-800">
                  {t("tutor")} {lessonData.lesson.tutor.firstName}{" "}
                  {lessonData.lesson.tutor.lastName}
                </h3>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <Link href={`mailto:${lessonData.lesson.tutor.email}`}>
                    {lessonData.lesson.tutor.email}
                  </Link>
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-primary-800">
                  {lessonData.lesson.subject.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {lessonData.lesson.subject.language.name} -{" "}
                  {lessonData.lesson.subject.language.level}
                </p>
              </div>

              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-sm">
                      {lessonData.lesson.subject.description}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">{t("description")}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-primary-800">
                    {t("date")}
                  </p>
                  <p className="text-sm">
                    {new Date(
                      lessonData.lesson.scheduledDateTime
                    ).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-primary-800">
                    {t("duration")}
                  </p>
                  <p className="text-sm">
                    {lessonData.lesson.durationMinutes} {t("minutes")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-primary-800">
                    {t("price")}
                  </p>
                  <p className="text-sm">
                    {lessonData.lesson.priceAmount}{" "}
                    {lessonData.lesson.priceCurrency}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-primary-800">
                    {t("status")}
                  </p>
                  <p className="text-sm">{t(lessonData.lesson.status)}</p>
                </div>
              </div>
              {user?.email === lessonData.lesson.tutor.email && (
                <div className="flex gap-2 float-right mt-4">
                  <Button
                    variant="outline"
                    className="btn-secondary"
                    onClick={handleDeleteClick}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? t("deleting") : t("delete")}
                  </Button>
                  <Button variant="outline" className="btn-primary">
                    {t("edit")}
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("confirmDelete")}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">{t("confirmDeleteMessage")}</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirmation(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? t("deleting") : t("confirm")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
