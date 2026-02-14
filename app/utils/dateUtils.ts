export function getUpcomingDates(): { day: string; date: string }[] {
  const today = new Date()
  const currentDay = today.getDay() // 0 is Sunday, 1 is Monday, etc.

  // Calculate the date of the most recent Monday
  const mostRecentMonday = new Date(today)
  mostRecentMonday.setDate(today.getDate() - ((currentDay + 6) % 7))

  // Calculate the upcoming Thursday, Friday, Saturday, and Sunday
  const upcomingDates = []
  const daysToAdd = [3, 4, 5, 6] // Days to add to get to Thursday, Friday, Saturday, Sunday

  for (const days of daysToAdd) {
    const date = new Date(mostRecentMonday)
    date.setDate(mostRecentMonday.getDate() + days)

    const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getDay()]
    const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}/${date.getFullYear()}`

    upcomingDates.push({ day: dayName, date: formattedDate })
  }

  return upcomingDates
}

