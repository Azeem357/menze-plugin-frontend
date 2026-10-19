// Format PKR currency
export const formatPKR = (value) => {
  if (!value) return 'PKR 0'
  return `PKR ${Number(value).toLocaleString('en-PK')}`
}

// Format percentage
export const formatPct = (value) => {
  if (!value) return '0%'
  return `${Number(value).toFixed(1)}%`
}

// Format ROAS
export const formatROAS = (value) => {
  if (!value) return '0x'
  return `${Number(value).toFixed(1)}x`
}

// Format date
export const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

// Get priority color
export const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high':   return 'border-red-500 bg-red-50'
    case 'medium': return 'border-amber-500 bg-amber-50'
    case 'low':    return 'border-gray-400 bg-gray-50'
    default:       return 'border-gray-400 bg-gray-50'
  }
}

// Get priority badge color
export const getPriorityBadge = (priority) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800'
    case 'medium':
      return 'bg-amber-100 text-amber-800'
    case 'low':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}