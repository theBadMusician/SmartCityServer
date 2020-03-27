Math.floor(Math.random() * 30) + 20;

const waitFor = (ms) => new Promise(r => setTimeout(r, ms))
const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

const start = async () => {
  await asyncForEach([1, 2, 3], async (num) => {
    await waitFor(2000)
    console.log(num)
  })
  console.log('Done')
}

start()


const waitFor = (ms) => new Promise(r => setTimeout(r, ms))
const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[Math.floor(Math.random() * 30) + 20], index, array)
  }
}

const start = async () => {
  await asyncForEach([1, 2, 3], async (num) => {
    await waitFor(5000)
    console.log(num)
  })
  console.log('Done')
}

start()