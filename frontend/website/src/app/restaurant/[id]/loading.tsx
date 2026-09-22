export default function RestaurantStorefrontLoading() {
  return (
    <div className="min-h-screen bg-[#fffbf7]" aria-busy="true">
      {/* Cover */}
      <div className="h-[235px] w-full animate-pulse bg-[#efe7dd] sm:h-[300px] lg:h-[350px]" />

      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
        {/* Identity */}
        <div className="flex flex-col gap-4 pt-[38px] sm:flex-row sm:items-start sm:gap-6 lg:gap-7">
          <div className="h-[100px] w-[100px] shrink-0 animate-pulse rounded-[20px] bg-[#efe7dd] sm:h-[112px] sm:w-[112px] lg:h-[132px] lg:w-[132px]" />
          <div className="flex-1 space-y-3 pt-[18px] sm:pt-[38px] lg:pt-[60px]">
            <div className="h-[30px] w-3/4 max-w-[380px] animate-pulse rounded-lg bg-[#ece4da]" />
            <div className="h-4 w-1/2 max-w-[240px] animate-pulse rounded-md bg-[#ece4da]" />
            <div className="h-4 w-2/5 max-w-[200px] animate-pulse rounded-md bg-[#f2ece4]" />
            <div className="h-6 w-full max-w-[520px] animate-pulse rounded-md bg-[#f2ece4]" />
          </div>
        </div>

        {/* Nav */}
        <div className="mt-8 flex items-center gap-5 border-y border-[#e9e2da]">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-4 w-14 animate-pulse rounded-md bg-[#ece4da]" />
          ))}
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-5 py-[42px] sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-[#efe7dd] bg-white">
              <div className="h-[128px] animate-pulse bg-[#efe7dd]" />
              <div className="space-y-2.5 p-4">
                <div className="h-4 w-3/4 animate-pulse rounded-md bg-[#f2ece4]" />
                <div className="h-3 w-1/2 animate-pulse rounded-md bg-[#f2ece4]" />
                <div className="h-8 w-full animate-pulse rounded-lg bg-[#f2ece4]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}