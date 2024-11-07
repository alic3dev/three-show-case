export async function processWithLog(
  name: string,
  icon: string,
  processFunction: () => Promise<void>,
): Promise<boolean> {
  console.log(`Processing: ${icon} ${name}...`)

  try {
    await processFunction()
  } catch {
    console.log(`Failed    : ❌ ${name}\n`)
    return false
  }

  console.log(`Processed : ✅ ${name}\n`)

  return true
}
