use('your_db_name'); // ← замени на имя своей базы

// USERS
db.users.insertMany([
  {
    username: "myuser",
    password: "$2b$10$QdybdrztapbxTR807H57t.egVFzOJP/vq0DGVVfgU7..."
  },
  {
    username: "newuser",
    password: "$2b$10$xq8z05pB0bYrJYf2Q4MvJOyePPSHao14dG8hCb0CWq...",
    created_at: new Date("2025-06-24T14:37:23Z")
  }
]);

// CATEGORIES
db.categories.insertOne({
  name: "tech",
  description: "новости ии и прочее",
  color: "#3B82F6",
  is_active: true,
  created_at: new Date("2025-07-07T13:09:25Z"),
  updated_at: new Date("2025-07-07T13:09:25Z")
});

// CHANNELS
db.channels.insertMany([
  {
    username: "@topor",
    channel_id: "-1001288489154",
    category: "Новости",
    created_at: new Date("2025-07-02T15:48:35Z")
  },
  {
    username: "@mash",
    channel_id: "-1001117628569",
    category: "Тиски",
    created_at: new Date("2025-07-02T15:49:13Z")
  },
  {
    username: "@naebnet",
    channel_id: "-1001222869173",
    category: "Tech",
    created_at: new Date("2025-07-02T15:50:03Z")
  },
  {
    username: "@hiaimedia",
    channel_id: "-1001836239552",
    category: "Tech",
    created_at: new Date("2025-07-02T15:50:42Z")
  },
  {
    username: "@chatgptv",
    channel_id: "-1001848122804",
    category: "Tech",
    created_at: new Date("2025-07-02T15:52:01Z"),
    category_id: "686bc705cc76152109983b0c"
  },
  {
    username: "@neyroseti_dr",
    channel_id: "-1001846105041",
    category: "Tech",
    created_at: new Date("2025-07-02T15:54:46Z")
  },
  {
    username: "@ayakakskazal",
    channel_id: "-1001917951843",
    category: "Tech",
    created_at: new Date("2025-07-02T15:58:50Z")
  },
  {
    username: "@topor+",
    channel_id: "-1001237513492",
    category: "asdfasdfsd",
    created_at: new Date("2025-07-04T11:29:53Z")
  },
  {
    username: "@rifmyinovosty",
    channel_id: "-1001375914436",
    category: "123",
    created_at: new Date("2025-07-04T11:30:52Z")
  },
  {
    username: "@post_news",
    channel_id: "-1002624835396",
    category: "asdjijdas",
    created_at: new Date("2025-07-04T11:40:05Z")
  }
]);

// POSTED_CHANNELS
db.posted_channels.insertMany([
  {
    name: "Тиски 18+",
    channel_id: "-1002367458469",
    channel_type: "private",
    is_active: true,
    signature: '<a href="https://t.me/addlist/1xQozidle8YzZGQy">👉 Все наши каналы здесь!</a>',
    created_at: new Date("2025-07-01T15:00:56.499Z"),
    updated_at: new Date("2025-07-01T15:00:56.499Z")
  },
  {
    name: "Тиски.Tech",
    channel_id: "-1002845084722",
    channel_type: "public",
    is_active: true,
    signature: '<a href="https://t.me/addlist/1xQozidle8YzZGQy">💻 Все наши каналы здесь!</a>',
    created_at: new Date("2025-07-01T15:01:24.931Z"),
    updated_at: new Date("2025-07-01T15:01:24.931Z")
  },
  {
    name: "Тиски.Play",
    channel_id: "-1002734651611",
    channel_type: "public",
    is_active: true,
    signature: '<a href="https://t.me/addlist/1xQozidle8YzZGQy">🎮 Все наши каналы здесь!</a>',
    created_at: new Date("2025-07-01T15:01:49.761Z"),
    updated_at: new Date("2025-07-01T15:01:49.761Z")
  },
  {
    name: "Тиски.Memes",
    channel_id: "-1002797173239",
    channel_type: "public",
    is_active: true,
    signature: '<a href="https://t.me/addlist/1xQozidle8YzZGQy">😄Все наши каналы — ТЫК</a>',
    created_at: new Date("2025-07-01T15:02:21.678Z"),
    updated_at: new Date("2025-07-01T15:02:21.678Z")
  },
  {
    name: "Тиски.Sport",
    channel_id: "-1002745264870",
    channel_type: "public",
    is_active: true,
    signature: '<a href="https://t.me/addlist/1xQozidle8YzZGQy">🏆 Все наши каналы здесь!</a>',
    created_at: new Date("2025-07-01T15:02:45.999Z"),
    updated_at: new Date("2025-07-01T15:02:45.999Z")
  },
  {
    name: "Тиски",
    channel_id: "-1002862672736",
    channel_type: "public",
    is_active: true,
    signature: '<a href="https://t.me/addlist/1xQozidle8YzZGQy">👉 Все наши каналы здесь!</a>',
    created_at: new Date("2025-07-01T15:03:49.445Z"),
    updated_at: new Date("2025-07-01T15:03:49.445Z")
  }
]); 