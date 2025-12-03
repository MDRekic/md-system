// frontend/src/components/calendar/JobCalendar.jsx

import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import { jobApi } from "../../api/jobApi";
import JobDetailsModal from "../jobs/JobDetailsModal";

const JobCalendar = () => {
  const [events, setEvents] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);

  // Formatter for column/day headers to German short weekday and numeric date
  const formatGermanHeader = (arg) => {
    const date = arg.date || arg;
    const parts = new Intl.DateTimeFormat("de", {
      weekday: "short",
      day: "numeric",
      month: "numeric",
    }).formatToParts(date instanceof Date ? date : new Date(date));

    const weekday = (parts.find((p) => p.type === "weekday")?.value || "").replace(/\./g, "");
    const day = parts.find((p) => p.type === "day")?.value || "";
    const month = parts.find((p) => p.type === "month")?.value || "";

    // Return plain text (FullCalendar accepts string or DOM nodes)
    return `${weekday} ${day}.${month}`;
  };

  const loadJobs = async (start, end) => {
    const res = await jobApi.getJobs({
      from: start.toISOString(),
      to: end.toISOString(),
    });

    const jobs = res.data.data || [];

    const mapped = jobs.map((job) => {
      // boja po statusu
      let color = "#1976d2"; // default plava (ASSIGNED / OPEN)

      if (job.status === "WAITING_REVIEW") {
        color = "#fbc02d"; // žuta
      } else if (job.status === "APPROVED") {
        color = "#388e3c"; // zelena
      } else if (job.status === "REJECTED") {
        color = "#d32f2f"; // crvena
      }

      return {
        id: job.id,
        title: `${job.order_number || "Nalog"} ${job.customer_city || ""}`,
        start: job.scheduled_from,
        end: job.scheduled_to,
        backgroundColor: color,
        borderColor: color,
        extendedProps: {
          job,
        },
      };
    });

    setEvents(mapped);
  };

  return (
    <>
      <FullCalendar
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        events={events}
        datesSet={(info) => loadJobs(info.start, info.end)}
        eventClick={(info) => {
          const job = info.event.extendedProps.job;
          setSelectedJob(job);
        }}
        // customize column/day headers to German short weekdays and numeric dates
        columnHeaderContent={formatGermanHeader}
        dayHeaderContent={formatGermanHeader}
        // set locale used by FullCalendar where applicable
        locale="de"
        height="auto"
      />

      <JobDetailsModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
      />
    </>
  );
};

export default JobCalendar;
