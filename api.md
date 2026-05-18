Let me explore all the component files in the `addons-ajman-hrd` folder and also look at existing API service patterns for reference. 

Created 4 todos

Read all addons-ajman-hrd TS files

Read [](file:///c%3A/Users/syeull/Downloads/newengineui/src/app/pages/addons-ajman-hrd/total-sessions/total-sessions.component.ts)

Read [](file:///c%3A/Users/syeull/Downloads/newengineui/src/app/pages/addons-ajman-hrd/reporting/reporting.component.ts)

Read [](file:///c%3A/Users/syeull/Downloads/newengineui/src/app/pages/addons-ajman-hrd/quality-of-experience/quality-of-experience.component.ts)

Read [](file:///c%3A/Users/syeull/Downloads/newengineui/src/app/pages/addons-ajman-hrd/inquiries/inquiries.component.ts)

Read [](file:///c%3A/Users/syeull/Downloads/newengineui/src/app/pages/addons-ajman-hrd/definationMethods/definationMethod.component.ts)

Read [](file:///c%3A/Users/syeull/Downloads/newengineui/src/app/pages/addons-ajman-hrd/frequently-asked-questions/frequently-asked-questions.component.ts)

Read [](file:///c%3A/Users/syeull/Downloads/newengineui/src/app/pages/addons-ajman-hrd/shared/components/accordion-section/accordion-section.component.ts)

Read [](file:///c%3A/Users/syeull/Downloads/newengineui/src/app/pages/addons-ajman-hrd/shared/components/session-card/session-card.components.ts)

Read [](file:///c%3A/Users/syeull/Downloads/newengineui/src/app/pages/addons-ajman-hrd/shared/components/answers-quality/answers-quality.component.ts)

Read [](file:///c%3A/Users/syeull/Downloads/newengineui/src/app/pages/addons-ajman-hrd/shared/components/conversation-summaries-card/conversation-summaries-card.component.ts)

Read [](file:///c%3A/Users/syeull/Downloads/newengineui/src/app/pages/addons-ajman-hrd/shared/components/f2-action-button/f2-action-button.component.ts)

Read [](file:///c%3A/Users/syeull/Downloads/newengineui/src/app/pages/addons-ajman-hrd/shared/components/monitoring-stat-card/monitoring-stat-card.component.ts)

Read [](file:///c%3A/Users/syeull/Downloads/newengineui/src/app/pages/addons-ajman-hrd/shared/components/filters-bar/filters-bar.component.ts)

Read [](file:///c%3A/Users/syeull/Downloads/newengineui/src/app/pages/addons-ajman-hrd/shared/components/session-ending-time-settings-dialog/session-ending-time-settings-dialog.component.ts)

Let me read the files directly in parallel batches.      

Read [](file:///c%3A/Users/syeull/Downloads/newengineui/src/app/pages/addons-ajman-hrd/total-sessions/total-sessions.component.ts)

Read [](file:///c%3A/Users/syeull/Downloads/newengineui/src/app/pages/addons-ajman-hrd/reporting/reporting.component.ts)

Read [](file:///c%3A/Users/syeull/Downloads/newengineui/src/app/pages/addons-ajman-hrd/quality-of-experience/quality-of-experience.component.ts)

Read [](file:///c%3A/Users/syeull/Downloads/newengineui/src/app/pages/addons-ajman-hrd/inquiries/inquiries.component.ts)

Read [](file:///c%3A/Users/syeull/Downloads/newengineui/src/app/pages/addons-ajman-hrd/frequently-asked-questions/frequently-asked-questions.component.ts)

Read [](file:///c%3A/Users/syeull/Downloads/newengineui/src/app/pages/addons-ajman-hrd/definationMethods/definationMethod.component.ts)

Starting: *Review existing API service patterns* (2/4)

Now let me read the shared components and also look at existing API service patterns:      

Read [](file:///c%3A/Users/syeull/Downloads/newengineui/src/app/pages/addons-ajman-hrd/shared/components/answers-quality/answers-quality.component.ts)

Read [](file:///c%3A/Users/syeull/Downloads/newengineui/src/app/pages/addons-ajman-hrd/shared/components/conversation-summaries-card/conversation-summaries-card.component.ts)

Read [](file:///c%3A/Users/syeull/Downloads/newengineui/src/app/pages/addons-ajman-hrd/shared/components/monitoring-stat-card/monitoring-stat-card.component.ts)

Read [](file:///c%3A/Users/syeull/Downloads/newengineui/src/app/pages/addons-ajman-hrd/shared/components/session-card/session-card.components.ts)

Read [](file:///c%3A/Users/syeull/Downloads/newengineui/src/app/pages/addons-ajman-hrd/shared/components/filters-bar/filters-bar.component.ts)

Read [](file:///c%3A/Users/syeull/Downloads/newengineui/src/app/pages/addons-ajman-hrd/shared/components/session-ending-time-settings-dialog/session-ending-time-settings-dialog.component.ts)

Now let me review an existing API service file for reference patterns:   

Read [](file:///c%3A/Users/syeull/Downloads/newengineui/src/app/data/api-services/cx-dashboard.service.ts)

Read [](file:///c%3A/Users/syeull/Downloads/newengineui/src/app/data/api-services/cx-report.service.ts#1-1), lines 1 to 80

Read [](file:///c%3A/Users/syeull/Downloads/newengineui/src/app/data/api-services/cx-chat.service.ts#1-1), lines 1 to 80

Starting: *Compile API requirements list* (4/4)

Let me also check the environment config and an existing interface file to understand the full pattern:  

Read [](file:///c%3A/Users/syeull/Downloads/newengineui/src/app/pages/addons-ajman-hrd/shared/components/accordion-section/accordion-section.component.ts)

Read [](file:///c%3A/Users/syeull/Downloads/newengineui/src/environments/environments.ts)

Completed: *Compile API requirements list* (4/4)

Here is the full analysis of all hardcoded data across the `addons-ajman-hrd` pages and the APIs needed to replace them:

---

## APIs Required for `addons-ajman-hrd` Module

### 1. **Dashboard / Reporting Monitoring Stats**
**Page:** reporting.component.ts
| Hardcoded Data | Current Values |
|---|---|
| `monitoringCards` array | Inquiries (5), Total Sessions (592), Total Users (13,465), Avg Session Duration (4:32) |

**API:** `GET /addons-ajman-hrd/dashboard/monitoring-stats`
- **Query params:** `periodType`, `startDate`, `endDate`
- **Response:** Array of `{ iconKey, label, value, changePct, changeDir, subText }`

---

### 2. **Total Sessions Time-Series**
**Page:** total-sessions.component.ts
| Hardcoded Data | Current Values |
|---|---|
| `weeklyLabels` / `weeklyCurrent` / `weeklyPrevious` | 7 weeks of chart data |
| `monthlyLabels` / `monthlyCurrent` / `monthlyPrevious` | 4 months of chart data |
| `yearlyLabels` / `yearlyCurrent` / `yearlyPrevious` | 1 year of chart data |
| `buildCards()` return values | Total (592), Average (118), Highest (234), etc. |

**API:** `GET /addons-ajman-hrd/sessions/stats`
- **Query params:** `periodType` (Weekly/Monthly/Yearly), `startDate`, `endDate`, `compareEnabled`
- **Response:**
```json
{
  "cards": [
    { "title": "...", "value": "592", "label": "...", "percentage": "20%" }
  ],
  "chart": {
    "labels": ["16 مارس", "23 مارس", ...],
    "current": [40, 60, 55, ...],
    "previous": [45, 58, 62, ...]
  }
}
```

---

### 3. **Uncovered Inquiries Log**
**Page:** inquiries.component.ts
| Hardcoded Data | Current Values |
|---|---|
| `inquiryLogs` array | 3 rows with time, classification, confidence, question |

**API:** `GET /addons-ajman-hrd/inquiries/uncovered`
- **Query params:** `startDate`, `endDate`, `page`, `pageSize`
- **Response:** Paginated `{ items: [{ time, classification, confidence, question }], totalItems }`

---

### 4. **Conversation Summaries**
**Page:** inquiries.component.ts
| Hardcoded Data | Current Values |
|---|---|
| `summaryLogs` array | 3 entries with topic, path, summary, name, channel, time |

**API:** `GET /addons-ajman-hrd/conversations/summaries`
- **Query params:** `startDate`, `endDate`, `page`, `pageSize`
- **Response:** Paginated `{ items: [{ topic, path, summary, name, channel, time }], totalItems }`

---

### 5. **Answers Quality Stats + Ratings Log**
**Pages:** inquiries.component.ts + answers-quality.component.ts
| Hardcoded Data | Current Values |
|---|---|
| `qualityStats` (in inquiries) | Total responses (300), Rated (240, 80%), Unrated (60, 20%) |
| `chartOptions` series data (in answers-quality) | Bar chart values (610, 1000, 410) |
| `ratingsLogs` (in answers-quality) | 4 entries with rating, answer, channel, time |

**API 5a:** `GET /addons-ajman-hrd/answers/quality-stats`
- **Query params:** `startDate`, `endDate`
- **Response:**
```json
{
  "stats": [
    { "label": "...", "value": 300 },
    { "label": "...", "value": 240, "subtext": "...", "percentage": 80 }
  ],
  "chart": {
    "positive": 610,
    "negative": 1000,
    "neutral": 410
  }
}
```

**API 5b:** `GET /addons-ajman-hrd/answers/ratings-log`
- **Query params:** `startDate`, `endDate`, `page`, `pageSize`
- **Response:** Paginated `{ items: [{ rating, answer, channel, time }], totalItems }`

---

### 6. **Quality of Experience (Satisfaction)**
**Page:** quality-of-experience.component.ts
| Hardcoded Data | Current Values |
|---|---|
| `tableData` | Positive (390), Negative (130), Neutral (130) with trends |
| `detailedChartOptions` series data | Bar chart current vs previous |
| `volumeStats` | Total sessions (1000), Rated (650), Unrated (350) |
| `sentimentStats` | Positive (390, 60%), Negative (130, 20%), Neutral (130, 20%) |
| `satisfactionLogs` | 9 entries with comment, rating, channel, time |

**API 6a:** `GET /addons-ajman-hrd/experience/volume-stats`
- **Query params:** `startDate`, `endDate`, `periodType`
- **Response:**
```json
{
  "totalSessions": { "value": "1000", "newSessions": "+115", "comparison": "11.14%", ... },
  "ratedSessions": { "value": "650", "avgTime": "4.5 دقائق", ... },
  "unratedSessions": { "value": "350", "avgTime": "1.2 دقيقة", ... }
}
```

**API 6b:** `GET /addons-ajman-hrd/experience/sentiment-stats`
- **Query params:** `startDate`, `endDate`, `periodType`, `compareEnabled`
- **Response:**
```json
{
  "sentimentStats": [
    { "label": "...", "value": "390", "percentage": "60%", ... }
  ],
  "tableData": [
    { "label": "تقييم إيجابي", "count": 390, "prevCount": 360, "trend": 8.3, "percentage": 58 }
  ],
  "chart": {
    "current": [610, 900, 450],
    "previous": [400, 780, 450]
  }
}
```

**API 6c:** `GET /addons-ajman-hrd/experience/satisfaction-log`
- **Query params:** `startDate`, `endDate`, `page`, `pageSize`
- **Response:** Paginated `{ items: [{ comment, ratingType, channel, time }], totalItems }`

---

### 7. **Frequently Asked Questions Stats + Charts**
**Page:** frequently-asked-questions.component.ts
| Hardcoded Data | Current Values |
|---|---|
| `faqStats` | Total inquiries (21,843), Most used source |
| `faqTableData` | 4 rows with question, source, satisfaction %, count, prevCount |
| `defaultChartOptions` / `comparisonChartOptions` series data | Bar chart document usage |
| `categoryChartOptions` series data | 10 category bars (Promotions, Leaves, etc.) |

**API 7a:** `GET /addons-ajman-hrd/faq/stats`
- **Query params:** `startDate`, `endDate`, `periodType`
- **Response:**
```json
{
  "totalInquiries": "21,843",
  "mostUsedSource": "دليل تخطيط قوى العاملة - 2024"
}
```

**API 7b:** `GET /addons-ajman-hrd/faq/top-questions`
- **Query params:** `startDate`, `endDate`, `periodType`, `compareEnabled`
- **Response:**
```json
{
  "items": [
    { "question": "...", "source": "...", "satisfaction": "30%", "count": 400, "prevCount": 360 }
  ]
}
```

**API 7c:** `GET /addons-ajman-hrd/faq/document-usage-chart`
- **Query params:** `startDate`, `endDate`, `compareEnabled`
- **Response:**
```json
{
  "labels": ["دليل نظام عمل...", "قانون الموارد...", "دليل تخطيط..."],
  "current": [620, 1000, 450],
  "previous": [605, 605, 605]
}
```

**API 7d:** `GET /addons-ajman-hrd/faq/category-distribution`
- **Query params:** `startDate`, `endDate`
- **Response:**
```json
{
  "labels": ["الترقيات", "الاجازات", ...],
  "values": [620, 820, 620, 410, 520, 810, 600, 215, 390, 700]
}
```

---

### 8. **KPI Definition Methods**
**Page:** definationMethod.component.ts
| Hardcoded Data | Current Values |
|---|---|
| `sections` array | 4 accordion sections with titles, subtitles, and item descriptions |

**API:** `GET /addons-ajman-hrd/kpi/definitions`
- **Response:**
```json
{
  "sections": [
    { "id": "...", "title": "...", "subtitle": "...", "items": [{ "title": "...", "description": "..." }] }
  ]
}
```

---

### 9. **Session Ending Time Settings**
**Page:** session-ending-time-settings-dialog.component.ts
| Hardcoded Data | Current Values |
|---|---|
| `minutes` = 5, `defaultMessage` | Idle timeout settings |

**API 9a:** `GET /addons-ajman-hrd/settings/session-timeout`
- **Response:** `{ minutes: 5, defaultMessage: "..." }`

**API 9b:** `PUT /addons-ajman-hrd/settings/session-timeout`
- **Body:** `{ minutes, defaultMessage }`
- **Response:** `{ success: true }`

---

### 10. **CSV Export**
**Page:** inquiries.component.ts (action button label "تصدير ملف CSV")

**API:** `GET /addons-ajman-hrd/export/csv`
- **Query params:** `reportType` (inquiries/sessions/faq/satisfaction), `startDate`, `endDate`
- **Response:** File download (blob)

---

## Summary Table

| # | API Endpoint | Method | Used By |
|---|---|---|---|
| 1 | `/addons-ajman-hrd/dashboard/monitoring-stats` | GET | Reporting page |
| 2 | `/addons-ajman-hrd/sessions/stats` | GET | Total Sessions page |
| 3 | `/addons-ajman-hrd/inquiries/uncovered` | GET | Inquiries page |
| 4 | `/addons-ajman-hrd/conversations/summaries` | GET | Inquiries page |
| 5a | `/addons-ajman-hrd/answers/quality-stats` | GET | Inquiries / Answers Quality |
| 5b | `/addons-ajman-hrd/answers/ratings-log` | GET | Answers Quality |
| 6a | `/addons-ajman-hrd/experience/volume-stats` | GET | Quality of Experience |
| 6b | `/addons-ajman-hrd/experience/sentiment-stats` | GET | Quality of Experience |
| 6c | `/addons-ajman-hrd/experience/satisfaction-log` | GET | Quality of Experience |
| 7a | `/addons-ajman-hrd/faq/stats` | GET | FAQ page |
| 7b | `/addons-ajman-hrd/faq/top-questions` | GET | FAQ page |
| 7c | `/addons-ajman-hrd/faq/document-usage-chart` | GET | FAQ page |
| 7d | `/addons-ajman-hrd/faq/category-distribution` | GET | FAQ page |
| 8 | `/addons-ajman-hrd/kpi/definitions` | GET | KPI Definition Methods |
| 9a | `/addons-ajman-hrd/settings/session-timeout` | GET | Session Timeout Dialog |
| 9b | `/addons-ajman-hrd/settings/session-timeout` | PUT | Session Timeout Dialog |
| 10 | `/addons-ajman-hrd/export/csv` | GET | Inquiries (CSV export) |

**Total: 17 API endpoints (15 GET + 1 PUT + 1 GET/download)**

All filter parameters (`periodType`, `startDate`, `endDate`, `compareEnabled`) follow the existing `FiltersBarValue` interface pattern already in use across the pages.