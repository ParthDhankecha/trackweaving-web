import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.scss'
})
export class Landing {

  protected readonly currentYear = new Date().getFullYear();

  protected readonly features: { iconSrc: string; title: string; desc: string; emphasis?: 'live' | 'realtime' }[] = [
    {
      iconSrc: 'images/features/live-production-tracking.png',
      title: 'Machine Production Tracking',
      emphasis: 'live',
      desc: 'See every machine\'s status, speed and production count update in real time.'
    },
    {
      iconSrc: 'images/features/historical-reports.png',
      title: 'Historical Production Reports',
      desc: 'Access shift‑wise and date‑range reports to review past performance trends.'
    },
    {
      iconSrc: 'images/features/stoppage-report.png',
      title: 'Machine Stoppage Reports',
      desc: 'Drill into every stoppage event — duration, cause and impact on output.'
    },
    {
      iconSrc: 'images/features/maintenance.png',
      title: 'Machine Maintenance Reminders',
      desc: 'Schedule and receive automatic reminders for routine machine maintenance.'
    },
    {
      iconSrc: 'images/features/alerts.png',
      title: 'Alerts',
      emphasis: 'realtime',
      desc: 'Instant notifications for stoppages, pick changes, overspeed and more.'
    },
    {
      iconSrc: 'images/features/spare-parts.png',
      title: 'Spare Parts Change Tracking',
      desc: 'Log every spare part replacement with timestamps and maintain a full history.'
    },
    {
      iconSrc: 'images/features/multi-language.png',
      title: 'Multi‑Language Support',
      desc: 'Full support for Gujarati, Hindi and English — for every team member.'
    },
    {
      iconSrc: 'images/features/multi-user.png',
      title: 'Multi‑User Access',
      desc: 'Assign roles for operators, supervisors and management with custom access levels.'
    },
  ];

  protected readonly alertTypes: { title: string; desc: string; color: string }[] = [
    {
      title: 'Set Pick Change Alert',
      desc: 'Notified when the pick count hits the configured threshold.',
      color: '#043A54'
    },
    {
      title: 'Machine Overspeed Alert',
      desc: 'Triggered when RPM exceeds the safe operating limit.',
      color: '#5D8F4A'
    },
    {
      title: 'Machine Stoppage Alert',
      desc: 'Immediate alert with siren ring for master users on any stop.',
      color: '#DC3545'
    },
    {
      title: 'Machine Low Speed Alert',
      desc: 'Alerts when a machine runs below the minimum expected speed.',
      color: '#FD7E14'
    },
  ];

  protected readonly benefits: { title: string; desc: string }[] = [
    {
      title: 'Reduce Downtime by 30–45%',
      desc: 'Instant visibility and live alerts let you fix problems before they escalate.'
    },
    {
      title: 'Increase Production & Efficiency',
      desc: 'Data‑driven optimization helps you squeeze more output from every shift.'
    },
    {
      title: 'Better Machine Maintenance',
      desc: 'Regular due reminders ensure machines are serviced before they fail.'
    },
    {
      title: 'Spare Parts Change Tracking',
      desc: 'Log every part change with date and machine details for full traceability.'
    },
    {
      title: 'Make Data Visible to Everyone',
      desc: 'From operators to top management — everyone sees what they need to.'
    },
    {
      title: 'Access Anywhere, Anytime',
      desc: 'Monitor your factory from your phone, tablet or computer — 24/7.'
    },
  ];
}
