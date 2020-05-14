async function* generateSequence(start: number, end: number) {
  for (let i = start; i <= end; i++) {
    // yay, can use await!
    await new Promise((resolve) => setTimeout(resolve, 1000));

    yield i;
  }
}

(async () => {
  const gen = generateSequence(1, 5);
  for await (const i of gen) {
    console.log(i);
  }
})();
