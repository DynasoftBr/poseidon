// const arr = [];

// for (let i = 0; i < 10000; i++) {
//   arr.push({ id: i, name: "teste" });
// }

// console.time();
// for (let i = 10000; i > 0; i--) {
//   const found = arr.find((a) => a.id === i);
// }
// console.timeEnd();

const map = new Map();

for (let i = 0; i < 10000; i++) {
  map.set(i, { id: i, name: "teste" });
}

console.time();
for (let i = 10000; i > 0; i--) {
  let found = map.get(i);
}
console.timeEnd();
