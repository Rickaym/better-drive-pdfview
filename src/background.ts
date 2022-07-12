chrome.runtime.onMessage.addListener((request, sender, _) => {
  const data: { [key: string]: any } = {};
  if (!sender.url) {
    console.log(`${sender} url is undefined`);
    return;
  }
  data[sender.url] = request.lastReadPage;
  console.log(`Saving ${data}`);
  chrome.storage.sync.set(data);
  return true;
});


