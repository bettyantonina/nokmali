// Also redirect browsers that still have the previous collection HTML cached.
(() => {
  const recording = /^#meditation-(0[1-9]|1[0-2])$/.exec(location.hash);
  const localIndex = location.protocol === "file:" ? "index.html" : "";
  const destination = new URL(`../rauhnaechte/${recording ? recording[1] + "/" : ""}${localIndex}`, location.href);
  destination.search = location.search;
  if (!recording) destination.hash = location.hash;
  location.replace(destination.href);
})();
