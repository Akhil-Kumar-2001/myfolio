---
name: Elevio
order: 2
year: "2025"
role: Solo build
problem: Buying a recorded course gets you the video classes, and access to the tutor who made them. A personalised experience.
summary: An e-learning platform where a recorded course comes with the tutor attached. Message them directly, book one-to-one video sessions, and work through the material with progress tracked as you go.
outcome: A learning platform where students browse and buy courses, then actually talk to the tutor who wrote them. Text chat over Socket.IO and scheduled one-to-one video calls over WebRTC. Tutors get a dashboard for course management, earnings, and student progress, with an admin role above both.
stack:
  - Next.js
  - Express
  - MongoDB
  - Socket.IO
  - WebRTC
  - Razorpay
  - EC2
  - S3
links:
  - label: Client source
    url: https://github.com/Akhil-Kumar-2001/Elevio_Client
  - label: Server source
    url: https://github.com/Akhil-Kumar-2001/Elevio_Server
published: true
---

## What it does

Three roles, each with its own view of the same system.

**Students** browse the catalogue, buy a course through Razorpay, and work
through it with progress tracked as they go. They can message the tutor directly
and book a one-to-one video session.

**Tutors** publish and update courses, run their own dashboard for earnings and
per-course performance, schedule video sessions, and follow how their students
are progressing.

**Admins** sit above both with a dashboard covering the whole platform.

## How it's built

Next.js on the front, Express and MongoDB behind it, deployed to EC2 with media
in S3. Auth is JWT with access and refresh tokens. Chat runs over Socket.IO;
video calls are peer-to-peer over WebRTC with the socket connection handling
signalling.

## Why I built it end to end

I wanted one project that contained all the parts I hadn't done yet: real-time
messaging, peer-to-peer video, payments, role-based access, and a dashboard that
had to aggregate real numbers. Building them separately would have been easier
and would have taught me less about how they interfere with each other.
