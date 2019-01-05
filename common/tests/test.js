// const waitFor = (ms) => new Promise(r => setTimeout(r, ms))

console.log('initing...');

const dateIni2 = new Date();
for (let i = 0; i < 10000000; i++) {
    const x = "teste".toUpperCase();
}
const dateFin2 = new Date();
console.log((dateIni2.getTime() - dateFin2.getTime() + "\n"));

const dateIni = new Date();
for (let i = 0; i < 10000000; i++) {
    const x = "teste".toLowerCase();
}
const dateFin = new Date();
console.log(dateIni.getTime() - dateFin.getTime() + "\n");


// const dateIni3 = new Date();
// for (const i = 0; i < 10000; i++) {
//     arr.find((el) => el == i);
// }
// const dateFin3 = new Date();
// console.log((dateIni3.getTime() - dateFin3.getTime() + "\n"));

// const dateIni4 = new Date();
// for (const i = 0; i < 10000; i++) {
//     map.get(i);
// }
// const dateFin4 = new Date();
// console.log((dateIni4.getTime() - dateFin4.getTime() + "\n"));

// const used = process.memoryUsage();
// for (const key in used) {
//   console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
// }

// console.log(sizeOf(obj));