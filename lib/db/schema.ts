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
  uniqueIndex,
  check,
  uuid,
  jsonb,
  type AnyPgColumn,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

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

export const servicesContent = pgTable("services_content", {
  id: serial("id").primaryKey(),
  kickerEn: text("kicker_en").notNull().default("Our Services"),
  kickerKo: text("kicker_ko").notNull().default("우리서비스"),
  kickerVi: text("kicker_vi").notNull().default("Các Liệu Trình Trị Liệu"),
  titleEn: text("title_en").notNull().default("Find Your Perfect Treatment"),
  titleKo: text("title_ko").notNull().default("나에게 맞는 편안함을 선택하세요"),
  titleVi: text("title_vi").notNull().default("Chọn liệu trình phù hợp với bạn"),
  subtitleEn: text("subtitle_en").notNull().default("Nine signature treatments, each tailored to how you want to feel."),
  subtitleKo: text("subtitle_ko").notNull().default("원하는 느낌에 맞춘 9가지 시그니처 트리트먼트."),
  subtitleVi: text("subtitle_vi").notNull().default("Chín liệu trình đặc trưng, được thiết kế theo cảm nhận bạn mong muốn."),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const serviceDurations = pgTable("service_durations", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
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
  visible: boolean("visible").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
})

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references((): AnyPgColumn => bookings.id, { onDelete: "set null" }),
  therapistId: integer("therapist_id").references(() => therapists.id, { onDelete: "set null" }),
  customerName: text("customer_name").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  commentEn: text("comment_en"),
  commentKo: text("comment_ko"),
  commentVi: text("comment_vi"),
  reviewDate: date("review_date").notNull(),
  approved: boolean("approved").notNull().default(false),
  adminReply: text("admin_reply"),
  adminEdited: boolean("admin_edited").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("reviews_booking_id_key").on(table.bookingId).where(sql`${table.bookingId} IS NOT NULL`),
  index("reviews_approved_date_idx").on(table.approved, table.reviewDate.desc()),
  check("reviews_rating_range", sql`${table.rating} BETWEEN 1 AND 5`),
])

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  serviceId: integer("service_id").notNull().references(() => services.id, { onDelete: "restrict" }),
  durationMinutes: integer("duration_minutes").notNull(),
  therapistId: integer("therapist_id").references(() => therapists.id, { onDelete: "set null" }),
  date: date("date").notNull(),
  time: text("time").notNull(),
  guests: integer("guests").notNull().default(1),
  customerName: text("customer_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  detailedAddress: text("detailed_address"),
  notes: text("notes"),
  subtotalVnd: bigint("subtotal_vnd", { mode: "number" }).notNull(),
  discountVnd: bigint("discount_vnd", { mode: "number" }).notNull().default(0),
  totalVnd: bigint("total_vnd", { mode: "number" }).notNull(),
  discountLabel: text("discount_label"),
  status: text("status").notNull().default("confirmed"),
  paymentStatus: text("payment_status").notNull().default("PENDING_PAYMENT"),
  paymentOrderId: text("payment_order_id").unique(),
  paymentTransactionId: text("payment_transaction_id"),
  paymentProvider: text("payment_provider").default("manual"),
  paymentMethod: text("payment_method").notNull().default("CASH"),
  paymentConfirmedAt: timestamp("payment_confirmed_at", { withTimezone: true }),
  confirmationTokenHash: text("confirmation_token_hash"),
  confirmationTokenExpiresAt: timestamp("confirmation_token_expires_at", { withTimezone: true }),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  locale: text("locale").$type<"en" | "vi" | "ko">(),
  accessTokenHash: text("access_token_hash").unique(),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  accessTokenRevokedAt: timestamp("access_token_revoked_at", { withTimezone: true }),
  submissionKey: uuid("submission_key").unique(),
  activity: jsonb("activity").$type<{ kind: string; at: string; date: string; time: string; actor?: "admin" | "admin_email"; requestedDate?: string; requestedTime?: string }[]>().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  confirmationEmailSentAt: timestamp("confirmation_email_sent_at", { withTimezone: true }),
  reminderEmailSentAt: timestamp("reminder_email_sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("bookings_confirmation_token_hash_key").on(table.confirmationTokenHash),
  index("bookings_status_start_idx").on(table.status, table.startAt),
  index("bookings_therapist_start_idx").on(table.therapistId, table.startAt),
  check("bookings_guests_range", sql`${table.guests} BETWEEN 1 AND 10`),
  check("bookings_time_order", sql`${table.endAt} > ${table.startAt}`),
  check("bookings_amounts_nonnegative", sql`${table.subtotalVnd} >= 0 AND ${table.discountVnd} >= 0 AND ${table.totalVnd} >= 0`),
])

export const vietnamHolidays = pgTable("vietnam_holidays", {
  id: serial("id").primaryKey(),
  year: integer("year").notNull(),
  date: date("date").notNull(),
  localName: text("local_name").notNull(),
  englishName: text("english_name").notNull(),
  fixedDate: boolean("fixed_date").notNull().default(false),
  source: text("source").notNull().default("nager.date"),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

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
  minNoticeHours: integer("min_notice_hours").notNull().default(1),
  maxGuests: integer("max_guests").notNull().default(20),
  openTime: text("open_time").notNull().default("09:00"),
  closeTime: text("close_time").notNull().default("01:00"),
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
  phone: text("phone"),
  question: text("question").notNull(),
  submissionToken: text("submission_token"),
  reply: text("reply"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  repliedAt: timestamp("replied_at", { withTimezone: true }),
  replyEmailStatus: text("reply_email_status").notNull().default("not_sent"),
  replyEmailSentAt: timestamp("reply_email_sent_at", { withTimezone: true }),
}, (table) => [
  uniqueIndex("questions_submission_token_key").on(table.submissionToken).where(sql`${table.submissionToken} IS NOT NULL`),
])

export const siteContent = pgTable("site_content", {
  key: text("key").primaryKey(),
  valueEn: text("value_en").notNull().default(""),
  valueKo: text("value_ko").notNull().default(""),
  valueVi: text("value_vi").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const navigationSettings = pgTable("navigation_settings", {
  id: serial("id").primaryKey(),
  menuKey: text("menu_key").notNull().unique(),
  labelEn: text("label_en").notNull().default(""),
  labelVi: text("label_vi").notNull().default(""),
  labelKo: text("label_ko").notNull().default(""),
  href: text("href").notNull().default("#"),
  visible: boolean("visible").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  fontFamily: text("font_family").notNull().default("inherit"),
  fontSize: text("font_size").notNull().default("sm"),
  fontWeight: text("font_weight").notNull().default("normal"),
  textColor: text("text_color").notNull().default("inherit"),
  hoverColor: text("hover_color").notNull().default("inherit"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const sectionStyles = pgTable("section_styles", {
  sectionKey: text("section_key").primaryKey(),
  titleColor: text("title_color"),
  titleSize: text("title_size").notNull().default("md"),
  bodyColor: text("body_color"),
  bodySize: text("body_size").notNull().default("md"),
  titleFont: text("title_font").notNull().default("inherit"),
  bodyFont: text("body_font").notNull().default("inherit"),
  titleAlign: text("title_align").notNull().default("center"),
  bodyAlign: text("body_align").notNull().default("center"),
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

export const kakaoConnections = pgTable("kakao_connections", {
  id: integer("id").primaryKey(),
  kakaoUserId: text("kakao_user_id").notNull(),
  nickname: text("nickname").notNull(),
  phoneNumber: text("phone_number").notNull(),
  accessTokenEncrypted: text("access_token_encrypted").notNull(),
  refreshTokenEncrypted: text("refresh_token_encrypted").notNull(),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }).notNull(),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scopes: text("scopes").array().notNull().default([]),
  status: text("status").notNull().default("connected"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [check("kakao_connections_id_check", sql`${table.id} = 1`)])

export const kakaoOAuthStates = pgTable("kakao_oauth_states", {
  stateHash: text("state_hash").primaryKey(),
  returnToOrigin: text("return_to_origin").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("kakao_oauth_states_expires_at_idx").on(table.expiresAt)])

export const kakaoNotifications = pgTable("kakao_notifications", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").unique(),
  bookingId: integer("booking_id").unique(),
  notificationType: text("notification_type").notNull().default("question"),
  status: text("status").notNull().default("pending"),
  attemptCount: integer("attempt_count").notNull().default(0),
  lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
  nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  lastError: text("last_error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("kakao_notifications_retry_idx").on(table.status, table.nextAttemptAt)])

export const contactSubmissionRateLimits = pgTable("contact_submission_rate_limits", {
  ipHash: text("ip_hash").primaryKey(),
  windowStartedAt: timestamp("window_started_at", { withTimezone: true }).notNull(),
  requestCount: integer("request_count").notNull().default(0),
})

export const adminPushSubscriptions = pgTable("admin_push_subscriptions", {
  endpoint: text("endpoint").primaryKey(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})
