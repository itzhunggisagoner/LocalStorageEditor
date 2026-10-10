const sample = {
  theme: "dark",
  username: "guest",
  visits: "12",
  cart: '{"items":[{"id":42,"qty":2},{"id":7,"qty":1}],"coupon":null}',
  authToken: "eyJhbGciOiJIUzI1NiJ9.demo.signature",
  banner_dismissed: "true",
  lastSearch: "mechanical keyboard",
  draft: ""
};

document.getElementById("demo-link").addEventListener("click", () => {
  for (const [k, v] of Object.entries(sample)) {
    localStorage.setItem(k, v);
  }

  window.dispatchEvent(new Event("storage-edited"));
  document.getElementById("storage").scrollIntoView({ block: "center" });
});
