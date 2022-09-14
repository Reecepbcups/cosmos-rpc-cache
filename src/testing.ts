
// const my_var = "my great day. my mine";
// // replace my_var "my" with "your"
// const your_var = my_var.replaceAll("my", "your");
// console.log(your_var);



const time1 = new Date("2022-09-14T09:40:49.83358047Z");
const time2 = new Date("2022-09-14T09:39:49.83358047Z");

// find the time difference between time1 & time2

const difference = (time1.getTime() - time2.getTime())/1_000; // seconds
console.log(difference);