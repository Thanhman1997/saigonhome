import {
  pgTable,
  serial,
  text,
  integer,
  bigint,
  boolean,
  date,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core"

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  icon: text("icon").notNull(),
  nameEn: text("name_en").notNull(),
  nameKo: text("name_ko").notNull(),
  nameVi: text("name_vi").notNull(),
  descEn: text("desc_en").notNull(),
  descKo: text("desc_ko").notNull(),
  descVi: text("desc_vi").notNull(),
  imageUrl: text("image_url"),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
})

export const serviceDurations = pgTable("service_durations", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").notNull(),
  minutes: integer("minutes").notNull(),
  priceVnd: bigint("price_vnd", { mode: "number" }).notNull(),
})

export const therapists = pgTable("therapists", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  age: integer("age"),
  heightCm: integer("height_cm"),
  weightKg: integer("weight_kg"),
  experienceYears: integer("experience_years"),
  locationEn: text("location_en"),
  locationKo: text("location_ko"),
  locationVi: text("location_vi"),
  languages: text("languages"),
  bioEn: text("bio_en"),
  bioKo: text("bio_ko"),
  bioVi: text("bio_vi"),
  photoUrl: text("photo_url"),
  available: boolean("available").notNull().default(true),
  status: text("status").notNull().default("draft"),
  maxBookingsPerDay: integer("max_bookings_per_day").notNull().default(4),
  sortOrder: integer("sort_order").notNull().default(0),
})

export const therapistWorkingHours = pgTable("therapist_working_hours", {
  id: serial("id").primaryKey(),
  therapistId: integer("therapist_id").notNull(),
  weekday: integer("weekday").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  active: boolean("active").notNull().default(true),
}, (table) => [index("idx_therapist_hours_lookup").on(table.therapistId, table.weekday)])

export const therapistDaysOff = pgTable("therapist_days_off", {
  id: serial("id").primaryKey(),
  therapistId: integer("therapist_id").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: text("reason"),
}, (table) => [index("idx_therapist_days_off_lookup").on(table.therapistId, table.startDate, table.endDate)])

export const serviceAreas = pgTable("service_areas", {
  id: serial("id").primaryKey(),
  nameEn: text("name_en").notNull(),
  nameKo: text("name_ko").notNull(),
  nameVi: text("name_vi").notNull(),
  active: boolean("active").notNull().default(true),
  defaultSurchargeVnd: bigint("default_surcharge_vnd", { mode: "number" }).notNull().default(0),
  defaultTravelMinutes: integer("default_travel_minutes").notNull().default(0),
})

export const therapistServiceAreas = pgTable("therapist_service_areas", {
  id: serial("id").primaryKey(),
  therapistId: integer("therapist_id").notNull(),
  serviceAreaId: integer("service_area_id").notNull(),
  active: boolean("active").notNull().default(true),
  surchargeVnd: bigint("surcharge_vnd", { mode: "number" }),
  travelMinutes: integer("travel_minutes"),
  isPrimary: boolean("is_primary").notNull().default(false),
}, (table) => [index("idx_therapist_areas_lookup").on(table.therapistId, table.serviceAreaId)])

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id"),
  therapistId: integer("therapist_id"),
  customerName: text("customer_name").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  reviewDate: date("review_date").notNull(),
  approved: boolean("approved").notNull().default(false),
})

export const bookingNotifications = pgTable("booking_notifications", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull(),
  event: text("event").notNull(),
  recipient: text("recipient").notNull(),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  status: text("status").notNull().default("pending"),
  providerMessageId: text("provider_message_id"),
  attemptCount: integer("attempt_count").notNull().default(0),
  lastError: text("last_error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_booking_notifications_booking").on(table.bookingId),
  index("idx_booking_notifications_failed").on(table.status),
])

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  totalBookings: integer("total_bookings").notNull().default(0),
  completedBookings: integer("completed_bookings").notNull().default(0),
  cancelledBookings: integer("cancelled_bookings").notNull().default(0),
  noShowBookings: integer("no_show_bookings").notNull().default(0),
  totalSpentVnd: bigint("total_spent_vnd", { mode: "number" }).notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("idx_customers_email").on(table.email), index("idx_customers_phone").on(table.phone)])

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  customerId: integer("customer_id"),
  serviceId: integer("service_id").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  therapistId: integer("therapist_id"),
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at").notNull(),
  date: date("date").notNull(),
  time: text("time").notNull(),
  guests: integer("guests").notNull().default(1),
  customerName: text("customer_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  detailedAddress: text("detailed_address"),
  serviceAreaId: integer("service_area_id"),
  serviceAreaName: text("service_area_name"),
  travelSurchargeVnd: bigint("travel_surcharge_vnd", { mode: "number" }).notNull().default(0),
  travelMinutes: integer("travel_minutes").notNull().default(0),
  notes: text("notes"),
  subtotalVnd: bigint("subtotal_vnd", { mode: "number" }).notNull(),
  discountVnd: bigint("discount_vnd", { mode: "number" }).notNull().default(0),
  totalVnd: bigint("total_vnd", { mode: "number" }).notNull(),
  discountLabel: text("discount_label"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_bookings_therapist_date").on(table.therapistId, table.date),
  index("idx_bookings_status").on(table.status),
])

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  nameEn: text("name_en").notNull(),
  nameKo: text("name_ko").notNull(),
  nameVi: text("name_vi").notNull(),
  descEn: text("desc_en").notNull(),
  descKo: text("desc_ko").notNull(),
  descVi: text("desc_vi").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  discountType: text("discount_type").notNull(),
  discountValue: numeric("discount_value").notNull(),
  applicableServiceIds: integer("applicable_service_ids").array().notNull().default([]),
  active: boolean("active").notNull().default(true),
  type: text("type").notNull().default("seasonal"),
  imageUrl: text("image_url"),
  discountLabel: text("discount_label"),
  sortOrder: integer("sort_order").notNull().default(0),
})

export const membershipPlans = pgTable("membership_plans", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  nameEn: text("name_en").notNull(),
  nameKo: text("name_ko").notNull(),
  nameVi: text("name_vi").notNull(),
  descriptionEn: text("description_en").notNull().default(""),
  descriptionKo: text("description_ko").notNull().default(""),
  descriptionVi: text("description_vi").notNull().default(""),
  benefits: text("benefits").array().notNull().default([]),
  validityDays: integer("validity_days"),
  priceVnd: bigint("price_vnd", { mode: "number" }).notNull(),
  bonusVnd: bigint("bonus_vnd", { mode: "number" }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
})

export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  questionEn: text("question_en").notNull(),
  questionKo: text("question_ko").notNull(),
  questionVi: text("question_vi").notNull(),
  answerEn: text("answer_en").notNull(),
  answerKo: text("answer_ko").notNull(),
  answerVi: text("answer_vi").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
})

export const heroContent = pgTable("hero_content", {
  id: serial("id").primaryKey(),
  kickerEn: text("kicker_en").notNull(), kickerKo: text("kicker_ko").notNull(), kickerVi: text("kicker_vi").notNull(),
  titleLine1En: text("title_line1_en").notNull(), titleLine1Ko: text("title_line1_ko").notNull(), titleLine1Vi: text("title_line1_vi").notNull(),
  titleLine2En: text("title_line2_en").notNull(), titleLine2Ko: text("title_line2_ko").notNull(), titleLine2Vi: text("title_line2_vi").notNull(),
  subtitleEn: text("subtitle_en").notNull(), subtitleKo: text("subtitle_ko").notNull(), subtitleVi: text("subtitle_vi").notNull(),
  ctaEn: text("cta_en").notNull(), ctaKo: text("cta_ko").notNull(), ctaVi: text("cta_vi").notNull(),
  imageUrl: text("image_url").notNull().default("/images/spa-hero.png"),
  visible: boolean("visible").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const aboutContent = pgTable("about_content", {
  id: serial("id").primaryKey(),
  titleEn: text("title_en").notNull().default(""),
  titleKo: text("title_ko").notNull().default(""),
  titleVi: text("title_vi").notNull().default(""),
  bodyEn: text("body_en").array().notNull().default([]),
  bodyKo: text("body_ko").array().notNull().default([]),
  bodyVi: text("body_vi").array().notNull().default([]),
  imageUrl: text("image_url"),
  visible: boolean("visible").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const lotusValues = pgTable("lotus_values", {
  id: serial("id").primaryKey(),
  textEn: text("text_en").notNull(),
  textKo: text("text_ko").notNull(),
  textVi: text("text_vi").notNull(),
  icon: text("icon").notNull().default("sparkles"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
})

export const designSettings = pgTable("design_settings", {
  id: serial("id").primaryKey(),
  fontHeading: text("font_heading").notNull().default("cormorant"),
  fontBody: text("font_body").notNull().default("dm-sans"),
  headingSize: text("heading_size").notNull().default("lg"),
  bodySize: text("body_size").notNull().default("md"),
  fontWeightBody: text("font_weight_body").notNull().default("normal"),
  lineHeight: text("line_height").notNull().default("normal"),
  colorPrimary: text("color_primary").notNull().default("#2b2016"),
  colorSecondary: text("color_secondary").notNull().default("#dcc9a0"),
  colorAccent: text("color_accent").notNull().default("#8a6a3f"),
  colorLotusPink: text("color_lotus_pink").notNull().default("#b06a71"),
  colorBackground: text("color_background").notNull().default("#f7f2e4"),
  colorForeground: text("color_foreground").notNull().default("#2b2016"),
  buttonRadius: text("button_radius").notNull().default("full"),
  buttonSize: text("button_size").notNull().default("md"),
  cardRadius: text("card_radius").notNull().default("lg"),
  cardShadow: text("card_shadow").notNull().default("sm"),
  presetKey: text("preset_key").notNull().default("lotus-premium"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const bookingSettings = pgTable("booking_settings", {
  id: serial("id").primaryKey(),
  advanceBookingDays: integer("advance_booking_days").notNull().default(30),
  minNoticeHours: integer("min_notice_hours").notNull().default(2),
  maxGuests: integer("max_guests").notNull().default(20),
  openTime: text("open_time").notNull().default("09:00"),
  closeTime: text("close_time").notNull().default("21:00"),
  closedWeekdays: integer("closed_weekdays").array().notNull().default([]),
  groupDiscount2: numeric("group_discount_2").notNull().default("0.02"),
  groupDiscount3: numeric("group_discount_3").notNull().default("0.03"),
  groupDiscount4: numeric("group_discount_4").notNull().default("0.05"),
  firstTimeDiscount: numeric("first_time_discount").notNull().default("0.05"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  question: text("question").notNull(),
  reply: text("reply"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  repliedAt: timestamp("replied_at", { withTimezone: true }),
})

export const siteContent = pgTable("site_content", {
  key: text("key").primaryKey(),
  valueEn: text("value_en").notNull().default(""),
  valueKo: text("value_ko").notNull().default(""),
  valueVi: text("value_vi").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const sectionStyles = pgTable("section_styles", {
  sectionKey: text("section_key").primaryKey(),
  titleColor: text("title_color"),
  titleSize: text("title_size").notNull().default("md"),
  bodyColor: text("body_color"),
  bodySize: text("body_size").notNull().default("md"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const contactInfo = pgTable("contact_info", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  whatsappUrl: text("whatsapp_url"),
  lineUrl: text("line_url"),
  kakaoUrl: text("kakao_url"),
  messengerUrl: text("messenger_url"),
  instagramUrl: text("instagram_url"),
  addressEn: text("address_en"),
  addressKo: text("address_ko"),
  addressVi: text("address_vi"),
  hoursEn: text("hours_en"),
  hoursKo: text("hours_ko"),
  hoursVi: text("hours_vi"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})
