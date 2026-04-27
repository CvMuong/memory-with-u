import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "./lib/supabase";

const FALLBACK_IMAGE =
    "/images/default.jpeg";

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function mapMemoryFromDatabase(item) {
  return {
    id: item.id,
    title: item.title,
    date: item.memory_date,
    description: item.description || "",
    image: item.image_url || FALLBACK_IMAGE,
  };
}

function formatDate(dateString) {
  if (!dateString) return "Chưa có ngày";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Ngày không hợp lệ";

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getValidSortedDates(memories) {
  return memories
      .map((item) => new Date(item.date))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());
}

function runTinyTests() {
  console.assert(typeof createId() === "string" && createId().length > 0, "createId should return a string");
  console.assert(formatDate("") === "Chưa có ngày", "formatDate should handle empty date");
  console.assert(formatDate("not-a-date") === "Ngày không hợp lệ", "formatDate should handle invalid date");
  console.assert(
      getValidSortedDates([{ date: "2024-02-14" }, { date: "bad-date" }]).length === 1,
      "getValidSortedDates should ignore invalid dates"
  );
  console.assert(
      mapMemoryFromDatabase({
        id: "1",
        title: "Demo",
        memory_date: "2024-02-14",
        description: "Test",
        image_url: "https://example.com/image.jpg",
      }).date === "2024-02-14",
      "mapMemoryFromDatabase should convert memory_date to date"
  );
  console.assert(typeof FALLBACK_IMAGE === "string" && FALLBACK_IMAGE.length > 0, "FALLBACK_IMAGE should be valid");  console.assert(formatDate("2024-02-14").includes("2024"), "formatDate should format valid dates");
}

runTinyTests();

function getDaysFromMemoryDate(dateString) {
  if (!dateString) return 0;

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 0;

  const today = new Date();
  const diff = today.getTime() - date.getTime();

  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function formatMemoryDays(dateString) {
  const days = getDaysFromMemoryDate(dateString);

  if (days === 0) return "Hôm nay là ngày kỷ niệm";
  if (days === 1) return "Đã bên nhau 1 ngày";

  return `Đã bên nhau ${days.toLocaleString("vi-VN")} ngày`;
}

function Icon({ name, size = 20, className = "", fill = "none" }) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill,
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    "aria-hidden": "true",
  };

  const icons = {
    plus: (
        <svg {...commonProps}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
    ),
    trash: (
        <svg {...commonProps}>
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>
    ),
    imagePlus: (
        <svg {...commonProps}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M8 10h.01" />
          <path d="M21 15l-5-5L5 21" />
          <path d="M16 5v6" />
          <path d="M13 8h6" />
        </svg>
    ),
    calendarHeart: (
        <svg {...commonProps}>
          <path d="M8 2v4" />
          <path d="M16 2v4" />
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M3 10h18" />
          <path d="M12 18s-3-1.8-3-4a1.8 1.8 0 0 1 3-1.2A1.8 1.8 0 0 1 15 14c0 2.2-3 4-3 4z" />
        </svg>
    ),
    heart: (
        <svg {...commonProps}>
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
        </svg>
    ),
    sparkles: (
        <svg {...commonProps}>
          <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
          <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
          <path d="M5 3l.8 2.2L8 6l-2.2.8L5 9l-.8-2.2L2 6l2.2-.8L5 3z" />
        </svg>
    ),
  };

  return icons[name] || null;
}

function Card({ children, className = "" }) {
  return <div className={`rounded-3xl ${className}`}>{children}</div>;
}

function CardContent({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

function FloatingHearts() {
  const hearts = useMemo(
      () =>
          Array.from({ length: 18 }, (_, index) => ({
            id: index,
            left: `${(index * 17) % 100}%`,
            size: 12 + ((index * 7) % 20),
            delay: (index % 7) * 0.6,
            duration: 7 + (index % 5),
            opacity: 0.12 + (index % 4) * 0.05,
          })),
      []
  );

  return (
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {hearts.map((heart) => (
            <motion.div
                key={heart.id}
                className="absolute bottom-[-60px] text-amber-200"
                style={{ left: heart.left, opacity: heart.opacity }}
                initial={{ y: 0, x: 0, rotate: 0, scale: 0.8 }}
                animate={{
                  y: [0, -260, -560, -900],
                  x: [0, heart.id % 2 === 0 ? 24 : -24, heart.id % 3 === 0 ? -18 : 18, 0],
                  rotate: [0, 18, -14, 10],
                  scale: [0.8, 1, 0.9, 1.15],
                }}
                transition={{
                  duration: heart.duration,
                  delay: heart.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
            >
              <Icon name="heart" size={heart.size} fill="currentColor" />
            </motion.div>
        ))}
      </div>
  );
}

function HeroSection({ memoriesCount, totalDays }) {
  return (
      <section className="relative z-10 px-5 py-12 md:px-12 lg:px-20">
        <motion.div
            className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#1d4ed8_0,transparent_30%),radial-gradient(circle_at_top_right,#f59e0b_0,transparent_28%),linear-gradient(180deg,#0f172a,#111827)] opacity-70"
            animate={{ opacity: [0.58, 0.78, 0.58] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative mx-auto max-w-6xl">
          <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center"
          >
            <div>
              <motion.div
                  whileHover={{ scale: 1.04 }}
                  className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-amber-100 shadow-lg shadow-amber-500/10 backdrop-blur"
              >
                <motion.span
                    animate={{ rotate: [0, 14, -10, 0], scale: [1, 1.15, 1] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Icon name="sparkles" size={16} />
                </motion.span>
                Anh thương Em ❤️
              </motion.div>

              <motion.h1
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  className="max-w-3xl bg-gradient-to-r from-white via-amber-100 to-slate-200 bg-clip-text text-4xl font-bold leading-tight text-transparent md:text-6xl"
              >
                Nơi lưu giữ những kỷ niệm của anh và Em ❤️
              </motion.h1>

              <motion.p
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="mt-5 max-w-2xl text-base leading-8 text-white/75 md:text-lg"
              >
                Một trang web nhỏ để lưu lại cột mốc, hình ảnh và những câu chuyện đáng nhớ. Bạn có thể thêm kỷ niệm mới bất kỳ lúc nào.
              </motion.p>

              <div className="mt-8 grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  { value: memoriesCount, label: "Kỷ niệm" },
                  { value: totalDays, label: "Ngày lưu giữ" },
                  { value: "∞", label: "Yêu thương" },
                ].map((item, index) => (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.25 + index * 0.1 }}
                        whileHover={{ y: -8, scale: 1.03 }}
                    >
                      <Card className="group border border-white/10 bg-white/10 text-white shadow-xl shadow-black/10 backdrop-blur transition duration-300 hover:border-amber-300/40 hover:bg-white/[0.14] hover:shadow-amber-500/20">
                        <CardContent className="relative overflow-hidden p-5">
                          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition duration-700 group-hover:translate-x-full" />
                          <motion.p
                              className="text-3xl font-bold"
                              animate={item.label === "Yêu thương" ? { scale: [1, 1.08, 1] } : {}}
                              transition={{ duration: 1.8, repeat: Infinity }}
                          >
                            {item.value}
                          </motion.p>
                          <p className="mt-1 text-sm text-white/65">{item.label}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                ))}
              </div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.15 }}
                whileHover={{ rotate: 0.6, scale: 1.015 }}
                className="relative"
            >
              <motion.div
                  className="absolute -inset-4 rounded-[2rem] bg-amber-500/20 blur-2xl"
                  animate={{ opacity: [0.35, 0.7, 0.35], scale: [1, 1.05, 1] }}
                  transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
              />

              <motion.img
                  src="/images/album.jpeg"
                  alt="Couple memory"
                  className="relative h-[430px] w-full rounded-[2rem] object-cover shadow-2xl"
                  animate={{ scale: [1, 1.035, 1] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              />

              <motion.div
                  className="absolute bottom-5 left-5 right-5 rounded-3xl border border-white/15 bg-black/35 p-5 shadow-2xl backdrop-blur-md"
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.65 }}
              >
                <div className="flex items-center gap-3">
                  <motion.div
                      className="grid h-11 w-11 place-items-center rounded-full bg-amber-500 shadow-lg shadow-amber-500/30"
                      animate={{ scale: [1, 1.12, 1] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Icon name="heart" fill="white" size={20} />
                  </motion.div>

                  <div>
                    <p className="font-semibold">Anh thương Em ❤️</p>
                    <p className="text-sm text-white/70">Đây là tất cả những gì anh muốn lưu giữ lại, tất cả mọi thứ về em</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>
  );
}

function FilmSection({ currentSlide, sortedMemories, activeSlide, setActiveSlide, nextSlide, prevSlide, openCinemaMode }) {
  return (
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-12 md:px-12 lg:px-20">
        <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.7 }}
            className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end"
        >
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-amber-200/80">Memory Film</p>
            <h2 className="text-3xl font-bold md:text-4xl">Thước phim kỷ niệm</h2>
          </div>

          <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={openCinemaMode}
              className="rounded-full bg-amber-500 px-6 py-4 text-sm font-semibold text-slate-950 shadow-xl shadow-amber-500/20 transition hover:bg-amber-400"
          >
            Chiếu lại kỷ niệm
          </motion.button>
        </motion.div>

        <Card className="relative overflow-hidden border border-white/10 bg-white/[0.06] shadow-2xl shadow-black/20 backdrop-blur">
          <CardContent className="relative min-h-[420px] p-0 md:min-h-[520px]">
            {currentSlide ? (
                <>
                  <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide.id}
                        className="absolute inset-0"
                        initial={{ opacity: 0, scale: 1.08, filter: "blur(10px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, scale: 0.96, filter: "blur(12px)" }}
                        transition={{ duration: 1.05, ease: "easeInOut" }}
                    >
                      <motion.img
                          src={currentSlide.image || FALLBACK_IMAGE}
                          alt={currentSlide.title}
                          className="h-full w-full object-cover"
                          animate={{ scale: [1, 1.08] }}
                          transition={{ duration: 5.2, ease: "easeOut" }}
                          onError={(event) => {
                            event.currentTarget.src = FALLBACK_IMAGE;
                          }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/35 to-slate-950/10" />
                      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,.18)_50%,rgba(0,0,0,.75)_100%)]" />
                      <motion.div
                          className="absolute inset-0 opacity-25"
                          style={{
                            backgroundImage:
                                "repeating-linear-gradient(0deg, rgba(255,255,255,.16) 0px, rgba(255,255,255,.16) 1px, transparent 1px, transparent 5px)",
                          }}
                          animate={{ y: [0, 10, 0] }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                      />
                    </motion.div>
                  </AnimatePresence>

                  <div className="absolute left-6 top-6 z-10 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-100 backdrop-blur">
                    Scene {activeSlide + 1}/{sortedMemories.length}
                  </div>

                  <motion.div
                      key={`${currentSlide.id}-text`}
                      className="absolute bottom-0 left-0 right-0 z-10 p-6 md:p-10"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.25 }}
                  >
                    <p className="mb-2 text-sm font-medium text-amber-100">
                      {formatDate(currentSlide.date)}
                    </p>

                    <motion.p
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.15 }}
                        className="mb-4 inline-flex rounded-full border border-amber-300/25 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-100 backdrop-blur"
                    >
                      {formatMemoryDays(currentSlide.date)}
                    </motion.p>                    <h3 className="max-w-3xl text-3xl font-bold leading-tight md:text-6xl">{currentSlide.title}</h3>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75 md:text-lg md:leading-8">
                      {currentSlide.description || "Một khoảnh khắc đáng nhớ trong hành trình của hai bạn."}
                    </p>

                    <div className="mt-7 flex items-center gap-3">
                      <motion.button
                          whileHover={{ scale: 1.05, x: -2 }}
                          whileTap={{ scale: 0.96 }}
                          type="button"
                          onClick={prevSlide}
                          className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                      >
                        Trước
                      </motion.button>
                      <motion.button
                          whileHover={{ scale: 1.05, x: 2 }}
                          whileTap={{ scale: 0.96 }}
                          type="button"
                          onClick={nextSlide}
                          className="rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400"
                      >
                        Tiếp theo
                      </motion.button>
                    </div>
                  </motion.div>

                  <div className="absolute bottom-0 left-0 z-20 h-1 w-full bg-white/10">
                    <motion.div
                        key={currentSlide.id}
                        className="h-full bg-amber-400"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 5.2, ease: "linear" }}
                    />
                  </div>

                  <div className="absolute right-5 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-3 md:flex">
                    {sortedMemories.map((memory, index) => (
                        <button
                            key={memory.id}
                            type="button"
                            onClick={() => setActiveSlide(index)}
                            className={`h-3 w-3 rounded-full transition ${
                                index === activeSlide ? "scale-125 bg-amber-300" : "bg-white/35 hover:bg-white/70"
                            }`}
                            aria-label={`Chuyển đến kỷ niệm ${index + 1}`}
                        />
                    ))}
                  </div>
                </>
            ) : (
                <div className="grid min-h-[420px] place-items-center p-8 text-center text-white/70">
                  Hãy thêm kỷ niệm đầu tiên để tạo thước phim của hai bạn.
                </div>
            )}
          </CardContent>
        </Card>
      </section>
  );
}

function MemoryForm({ form, preview, savedPulse, onChange, onImageFile, onSubmit }) {
  return (
      <motion.div
          initial={{ opacity: 0, x: -26 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.65 }}
      >
        <Card className="h-fit border border-white/10 bg-white/[0.06] text-white shadow-2xl backdrop-blur transition duration-300 hover:border-amber-300/30 hover:shadow-amber-500/10">
          <CardContent className="p-6 md:p-7">
            <div className="mb-6 flex items-center gap-3">
              <motion.div
                  className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-500/90 shadow-lg shadow-amber-500/20"
                  animate={{ rotate: savedPulse ? [0, -12, 12, 0] : 0, scale: savedPulse ? [1, 1.18, 1] : 1 }}
                  transition={{ duration: 0.55 }}
              >
                <Icon name="plus" size={22} />
              </motion.div>

              <div>
                <h2 className="text-2xl font-bold">Thêm kỷ niệm mới</h2>
                <p className="text-sm text-white/60">Dữ liệu sẽ được lưu trên trình duyệt của bạn</p>
              </div>
            </div>

            <AnimatePresence>
              {savedPulse && (
                  <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.96 }}
                      className="mb-4 rounded-2xl border border-amber-300/25 bg-amber-500/15 px-4 py-3 text-sm text-amber-100"
                  >
                    Đã lưu kỷ niệm mới vào dòng thời gian ✨
                  </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-white/70">Tên kỷ niệm</label>
                <input
                    name="title"
                    value={form.title}
                    onChange={onChange}
                    placeholder="Ví dụ: Lần đầu đi Đà Lạt"
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 outline-none transition duration-300 placeholder:text-white/35 focus:border-amber-400 focus:bg-white/[0.14] focus:shadow-lg focus:shadow-amber-500/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">Ngày kỷ niệm</label>
                <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={onChange}
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 outline-none transition duration-300 focus:border-amber-400 focus:bg-white/[0.14] focus:shadow-lg focus:shadow-amber-500/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">Mô tả</label>
                <textarea
                    name="description"
                    value={form.description}
                    onChange={onChange}
                    rows={4}
                    placeholder="Viết vài dòng về kỷ niệm này..."
                    className="w-full resize-none rounded-2xl border border-white/10 bg-white/10 px-4 py-3 outline-none transition duration-300 placeholder:text-white/35 focus:border-amber-400 focus:bg-white/[0.14] focus:shadow-lg focus:shadow-amber-500/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">Ảnh kỷ niệm</label>
                <div className="grid gap-3">
                  <input
                      name="image"
                      value={form.image.startsWith("data:") ? "Đã chọn ảnh từ máy" : form.image}
                      onChange={onChange}
                      placeholder="Dán link ảnh hoặc upload ảnh bên dưới"
                      className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 outline-none transition duration-300 placeholder:text-white/35 focus:border-amber-400 focus:bg-white/[0.14] focus:shadow-lg focus:shadow-amber-500/10"
                  />

                  <motion.label
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-amber-300/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 transition hover:bg-amber-500/20"
                  >
                    <Icon name="imagePlus" size={18} /> Chọn ảnh từ máy
                    <input type="file" accept="image/*" onChange={onImageFile} className="hidden" />
                  </motion.label>
                </div>
              </div>

              <AnimatePresence>
                {preview && (
                    <motion.img
                        src={preview}
                        alt="Preview"
                        className="h-48 w-full rounded-2xl object-cover shadow-xl"
                        initial={{ opacity: 0, height: 0, scale: 0.96 }}
                        animate={{ opacity: 1, height: 192, scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.96 }}
                        transition={{ duration: 0.35 }}
                    />
                )}
              </AnimatePresence>

              <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="relative w-full overflow-hidden rounded-2xl bg-amber-500 px-5 py-4 text-base font-semibold text-white shadow-lg shadow-amber-500/20 transition hover:bg-amber-600"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition duration-700 hover:translate-x-full" />
                <span className="relative">Lưu kỷ niệm</span>
              </motion.button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
  );
}

function TimelineSection({ memories, onRemove }) {
  return (
      <div>
        <motion.div
            className="mb-7 flex items-center justify-between gap-4"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55 }}
        >
          <div>
            <h2 className="text-3xl font-bold">Cột mốc kỷ niệm</h2>
            <p className="mt-2 text-white/60">Dòng thời gian những điều đáng nhớ</p>
          </div>

          <motion.div animate={{ rotate: [0, 6, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
            <Icon name="calendarHeart" size={36} className="text-amber-300" />
          </motion.div>
        </motion.div>

        {memories.length === 0 ? (
            <Card className="border border-white/10 bg-white/[0.06] p-8 text-center text-white/70">
              Chưa có kỷ niệm nào. Hãy thêm kỷ niệm đầu tiên của hai bạn.
            </Card>
        ) : (
            <div className="relative space-y-6 before:absolute before:left-5 before:top-2 before:h-full before:w-px before:bg-gradient-to-b before:from-amber-300/50 before:via-white/10 before:to-transparent">
              <AnimatePresence initial={false}>
                {memories.map((memory, index) => (
                    <motion.div
                        key={memory.id}
                        initial={{ opacity: 0, y: 30, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 80, scale: 0.96 }}
                        transition={{ duration: 0.45, delay: index * 0.04 }}
                        layout
                        className="relative pl-14"
                    >
                      <motion.div
                          className="absolute left-0 top-5 grid h-10 w-10 place-items-center rounded-full border border-amber-300/40 bg-amber-500 shadow-lg shadow-amber-500/20"
                          animate={{
                            boxShadow: [
                              "0 0 0 0 rgba(245,158,11,.25)",
                              "0 0 0 12px rgba(245,158,11,0)",
                              "0 0 0 0 rgba(245,158,11,0)",
                            ],
                          }}
                          transition={{ duration: 2.4, repeat: Infinity, delay: index * 0.25 }}
                      >
                        <Icon name="heart" fill="white" size={17} />
                      </motion.div>

                      <motion.div whileHover={{ y: -8, scale: 1.012 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
                        <Card className="group overflow-hidden border border-white/10 bg-white/[0.06] text-white shadow-xl backdrop-blur transition duration-300 hover:border-amber-300/35 hover:bg-white/[0.09] hover:shadow-amber-500/10">
                          <CardContent className="grid gap-0 p-0 md:grid-cols-[220px_1fr]">
                            <div className="overflow-hidden">
                              <motion.img
                                  src={memory.image || FALLBACK_IMAGE}
                                  alt={memory.title}
                                  className="h-64 w-full object-cover md:h-full"
                                  whileHover={{ scale: 1.08 }}
                                  transition={{ duration: 0.5 }}
                                  onError={(event) => {
                                    event.currentTarget.src = FALLBACK_IMAGE;
                                  }}
                              />
                            </div>

                            <div className="relative overflow-hidden p-6">
                              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent transition duration-700 group-hover:translate-x-full" />

                              <div className="relative mb-3 flex items-start justify-between gap-4">
                                <div>
                                  <p className="text-sm font-medium text-amber-200">{formatDate(memory.date)}</p>

                                  <p className="mt-2 inline-flex rounded-full border border-amber-300/25 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-100">
                                    {formatMemoryDays(memory.date)}
                                  </p>                                  <h3 className="mt-1 text-2xl font-bold transition duration-300 group-hover:text-amber-100">
                                    {memory.title}
                                  </h3>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.08, rotate: -5 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => onRemove(memory.id)}
                                    className="rounded-xl border border-white/10 bg-white/10 p-2 text-white/70 transition hover:bg-red-500/20 hover:text-red-200"
                                    title="Xóa kỷ niệm"
                                    type="button"
                                >
                                  <Icon name="trash" size={18} />
                                </motion.button>
                              </div>

                              <p className="relative leading-7 text-white/70">
                                {memory.description || "Chưa có mô tả cho kỷ niệm này."}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </motion.div>
                ))}
              </AnimatePresence>
            </div>
        )}
      </div>
  );
}

function CinemaOverlay({ isOpen, currentSlide, onClose, onPrev, onNext }) {
  return (
      <AnimatePresence>
        {isOpen && currentSlide && (
            <motion.div
                className="fixed inset-0 z-[999] bg-black"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
            >
              <AnimatePresence mode="wait">
                <motion.img
                    key={`cinema-${currentSlide.id}`}
                    src={currentSlide.image || FALLBACK_IMAGE}
                    alt={currentSlide.title}
                    className="absolute inset-0 h-full w-full object-cover opacity-70"
                    initial={{ scale: 1.08, opacity: 0 }}
                    animate={{
                      scale: [1.05, 1.13],
                      x: [0, -18],
                      y: [0, -10],
                    }}
                    exit={{ scale: 0.96, opacity: 0 }}
                    transition={{
                      duration: 6,
                      ease: "easeOut",
                    }}
                    onError={(event) => {
                      event.currentTarget.src = FALLBACK_IMAGE;
                    }}
                />
              </AnimatePresence>

              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/90" />
              <div className="absolute left-1/2 top-8 z-20 -translate-x-1/2 rounded-full border border-white/15 bg-white/10 px-6 py-3 text-xs font-medium text-white backdrop-blur md:text-sm">
                Cinema Mode • Memory Replay
              </div>

              <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-5 top-8 z-20 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 md:right-8"
              >
                Đóng
              </button>

              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center">
                <motion.p
                    key={`date-${currentSlide.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="mb-4 text-xs uppercase tracking-[0.25em] text-amber-200 md:text-sm md:tracking-[0.35em]"
                >
                  {formatDate(currentSlide.date)}
                  <motion.div
                      key={`days-${currentSlide.id}`}
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.7, delay: 0.15 }}
                      className="mb-6 rounded-full border border-amber-300/30 bg-amber-500/15 px-6 py-3 text-sm font-semibold text-amber-100 backdrop-blur md:text-base"
                  >
                    {formatMemoryDays(currentSlide.date)}
                  </motion.div>
                </motion.p>

                <motion.h2
                    key={`title-${currentSlide.id}`}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="max-w-5xl text-4xl font-bold leading-tight text-white md:text-7xl"
                >
                  {currentSlide.title}
                </motion.h2>

                <motion.p
                    key={`desc-${currentSlide.id}`}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="mt-6 max-w-3xl text-base leading-8 text-white/80 md:text-xl"
                >
                  {currentSlide.description || "Một khoảnh khắc thật đẹp trong hành trình của hai bạn."}
                </motion.p>

                <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                  <button
                      type="button"
                      onClick={onPrev}
                      className="rounded-full border border-white/15 bg-white/10 px-6 py-3 text-white backdrop-blur transition hover:bg-white/20"
                  >
                    Cảnh trước
                  </button>

                  <button
                      type="button"
                      onClick={onNext}
                      className="rounded-full bg-amber-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-400"
                  >
                    Cảnh tiếp theo
                  </button>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 z-20 h-1 w-full bg-white/10">
                <motion.div
                    key={`cinema-progress-${currentSlide.id}`}
                    className="h-full bg-amber-400"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 5.2, ease: "linear" }}
                />
              </div>
            </motion.div>
        )}
      </AnimatePresence>
  );
}

export default function CoupleMemoryWebsite() {
  const [memories, setMemories] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [form, setForm] = useState({ title: "", date: "", description: "", image: "" });
  const [preview, setPreview] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [savedPulse, setSavedPulse] = useState(false);
  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchMemories();
  }, []);

  async function fetchMemories() {
    setIsLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
        .from("memories")
        .select("id,title,memory_date,description,image_url,created_at")
        .order("memory_date", { ascending: false });

    if (error) {
      console.error(error);
      setErrorMessage("Không thể tải danh sách kỷ niệm từ Supabase.");
      setIsLoading(false);
      return;
    }

    setMemories((data || []).map(mapMemoryFromDatabase));
    setIsLoading(false);
  }

  async function uploadImageToSupabase(file) {
    if (!file) return null;

    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${createId()}.${fileExt}`;
    const filePath = `memories/${fileName}`;

    const { error } = await supabase.storage
        .from("memory-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

    if (error) {
      console.error(error);
      throw new Error("Upload ảnh thất bại.");
    }

    const { data } = supabase.storage.from("memory-images").getPublicUrl(filePath);
    return data.publicUrl;
  }

  const sortedMemories = useMemo(() => {
    return [...memories].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [memories]);

  const totalDays = useMemo(() => {
    const validDates = getValidSortedDates(memories);
    if (!validDates.length) return 0;

    const diff = Date.now() - validDates[0].getTime();
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }, [memories]);

  const currentSlide = sortedMemories[activeSlide];

  useEffect(() => {
    if (!sortedMemories.length) return undefined;

    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % sortedMemories.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, [sortedMemories.length]);

  useEffect(() => {
    if (activeSlide > sortedMemories.length - 1) {
      setActiveSlide(0);
    }
  }, [activeSlide, sortedMemories.length]);

  function nextSlide() {
    if (!sortedMemories.length) return;
    setActiveSlide((prev) => (prev + 1) % sortedMemories.length);
  }

  function prevSlide() {
    if (!sortedMemories.length) return;
    setActiveSlide((prev) => (prev - 1 + sortedMemories.length) % sortedMemories.length);
  }

  function handleChange(e) {
    const { name, value } = e.target;

    if (name === "image" && form.image.startsWith("data:") && value === "Đã chọn ảnh từ máy") {
      return;
    }

    if (name === "image") {
      setImageFile(null);
      setPreview(value);
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleImageFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    setForm((prev) => ({ ...prev, image: "" }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.title.trim() || !form.date) {
      window.alert("Vui lòng nhập tên kỷ niệm và ngày kỷ niệm.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");

      let imageUrl = form.image || FALLBACK_IMAGE;

      if (imageFile) {
        imageUrl = await uploadImageToSupabase(imageFile);
      }

      const { data, error } = await supabase
          .from("memories")
          .insert({
            title: form.title.trim(),
            memory_date: form.date,
            description: form.description.trim(),
            image_url: imageUrl,
          })
          .select("id,title,memory_date,description,image_url,created_at")
          .single();

      if (error) {
        console.error(error);
        setErrorMessage("Lưu kỷ niệm thất bại. Hãy kiểm tra RLS policy trong Supabase.");
        setIsLoading(false);
        return;
      }

      setMemories((prev) => [mapMemoryFromDatabase(data), ...prev]);
      setForm({ title: "", date: "", description: "", image: "" });
      setImageFile(null);
      setPreview("");
      setSavedPulse(true);
      window.setTimeout(() => setSavedPulse(false), 1200);
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setErrorMessage("Có lỗi khi upload ảnh hoặc lưu dữ liệu.");
      setIsLoading(false);
    }
  }

  function openCinemaMode() {
    if (!sortedMemories.length) {
      window.alert("Hãy thêm ít nhất một kỷ niệm để bắt đầu trình chiếu.");
      return;
    }
    setIsCinemaMode(true);
  }

  async function removeMemory(id) {
    const confirmed = window.confirm("Bạn có chắc muốn xóa kỷ niệm này không?");
    if (!confirmed) return;

    setIsLoading(true);
    setErrorMessage("");

    const { error } = await supabase.from("memories").delete().eq("id", id);

    if (error) {
      console.error(error);
      setErrorMessage("Xóa kỷ niệm thất bại. Hãy kiểm tra RLS policy trong Supabase.");
      setIsLoading(false);
      return;
    }

    setMemories((prev) => prev.filter((item) => item.id !== id));
    setIsLoading(false);
  }

  return (
      <main className="relative min-h-screen overflow-hidden bg-[#0f172a] text-white">
        <FloatingHearts />

        <motion.div
            className="pointer-events-none fixed left-1/2 top-1/2 z-0 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/10 blur-3xl"
            animate={{ scale: [1, 1.18, 1], opacity: [0.18, 0.32, 0.18] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />

        {errorMessage && (
            <div className="fixed left-1/2 top-5 z-[1000] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-2xl border border-red-400/30 bg-red-500/20 px-5 py-4 text-sm text-red-100 shadow-2xl backdrop-blur">
              {errorMessage}
            </div>
        )}

        {isLoading && (
            <div className="fixed bottom-5 right-5 z-[1000] rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm text-white shadow-2xl backdrop-blur">
              Đang xử lý...
            </div>
        )}

        <HeroSection memoriesCount={memories.length} totalDays={totalDays} />

        <FilmSection
            currentSlide={currentSlide}
            sortedMemories={sortedMemories}
            activeSlide={activeSlide}
            setActiveSlide={setActiveSlide}
            nextSlide={nextSlide}
            prevSlide={prevSlide}
            openCinemaMode={openCinemaMode}
        />

        <section className="relative z-10 mx-auto grid max-w-6xl gap-8 px-5 py-12 md:px-12 lg:grid-cols-[0.85fr_1.15fr] lg:px-20">
          <MemoryForm
              form={form}
              preview={preview}
              savedPulse={savedPulse}
              onChange={handleChange}
              onImageFile={handleImageFile}
              onSubmit={handleSubmit}
          />

          <TimelineSection memories={sortedMemories} onRemove={removeMemory} />
        </section>

        <CinemaOverlay
            isOpen={isCinemaMode}
            currentSlide={currentSlide}
            onClose={() => setIsCinemaMode(false)}
            onPrev={prevSlide}
            onNext={nextSlide}
        />
      </main>
  );
}
