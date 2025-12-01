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
