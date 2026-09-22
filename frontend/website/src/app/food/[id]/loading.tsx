export default function FoodDetailLoading() {
  return (
    <div className="min-h-screen bg-[#fffbf7]" aria-busy="true">
      {/* Navbar placeholder */}
      <div className="h-[68px] w-full border-b border-black/5 bg-cream-50/95 lg:h-[76px]" />

      <div className="mx-auto w-full max-w-[1240px] px-4 pb-[80px] pt-8 md:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-7 flex items-center gap-2">
          <div className="h-3 w-10 animate-pulse rounded bg-[#ece4da]" />
          <span className="text-[#c9c2ba]">/</span>
          <div className="h-3 w-20 animate-pulse rounded bg-[#ece4da]" />
          <span className="text-[#c9c2ba]">/</span>
          <div className="h-3 w-24 animate-pulse rounded bg-[#ece4da]" />
        </div>

        <div className="grid grid-cols-1 items-start gap-9 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
          {/* Gallery skeleton */}
          <div className="min-w-0">
            <div className="h-[330px] w-full animate-pulse rounded-[24px] bg-[#efe7dd] sm:h-[430px] lg:h-[500px]" />
            <div className="mt-4 grid grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-[68px] animate-pulse rounded-[13px] bg-[#f1eae1] sm:h-[88px]" />
              ))}
            </div>
            <div className="mt-5 flex items-center gap-3.5 rounded-[16px] border border-[#eee8e2] bg-white p-4">
              <div className="h-[58px] w-[58px] animate-pulse rounded-[14px] bg-[#f1eae1]" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-1/2 animate-pulse rounded bg-[#f1eae1]" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-[#f5efe8]" />
              </div>
              <div className="h-3 w-20 animate-pulse rounded bg-[#f5efe8]" />
            </div>
          </div>

          {/* Details skeleton */}
          <div className="min-w-0 space-y-4">
            <div className="h-7 w-28 animate-pulse rounded-full bg-[#f5e3d2]" />
            <div className="h-9 w-3/4 animate-pulse rounded-lg bg-[#ece4da]" />
            <div className="h-9 w-2/3 animate-pulse rounded-lg bg-[#ece4da]" />
            <div className="h-4 w-full max-w-[460px] animate-pulse rounded bg-[#f1eae1]" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-[#f1eae1]" />

            <div className="mt-6 space-y-3 border-b border-[#eee8e2] pb-6">
              <div className="h-3.5 w-64 animate-pulse rounded bg-[#f1eae1]" />
              <div className="h-3.5 w-48 animate-pulse rounded bg-[#f1eae1]" />
            </div>

            <div className="h-12 w-56 animate-pulse rounded-lg bg-[#ece4da]" />

            {[...Array(3)].map((_, i) => (
              <div key={i} className="mt-6 space-y-3">
                <div className="h-4 w-44 animate-pulse rounded bg-[#ece4da]" />
                <div className="h-16 animate-pulse rounded-[14px] bg-[#f5efe8]" />
              </div>
            ))}

            <div className="mt-6 rounded-[20px] border border-[#eee8e2] bg-white p-5">
              <div className="h-12 w-full animate-pulse rounded-[14px] bg-[#f6dfcc]" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer placeholder */}
      <div className="h-40 w-full animate-pulse bg-[#ece4da]" />
    </div>
  )
}