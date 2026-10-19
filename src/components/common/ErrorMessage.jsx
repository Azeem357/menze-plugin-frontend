const ErrorMessage = ({ message }) => (
  <div className="
    bg-red-50 border border-red-200
    rounded-xl p-4 text-red-700
    text-sm
  ">
    ⚠️ {message || 'Something went wrong. Please try again.'}
  </div>
)

export default ErrorMessage