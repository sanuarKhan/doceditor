export default function ProjectLoading() {
    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar Skeleton */}
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="p-4 space-y-4">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-8 w-full bg-gray-100 rounded animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="flex-1 flex flex-col">
                {/* Toolbar Skeleton */}
                <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4 justify-between">
                    <div className="flex gap-2">
                        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
                </div>

                {/* Editor Area Skeleton */}
                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-12 min-h-[800px] space-y-6">
                        <div className="h-10 w-3/4 bg-gray-200 rounded animate-pulse mx-auto" />
                        <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse mx-auto" />
                        <div className="h-4 w-full bg-gray-200 rounded animate-pulse mt-12" />
                        <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />

                        <div className="space-y-4 mt-8">
                            <div className="h-20 w-full bg-gray-100 rounded animate-pulse" />
                            <div className="h-20 w-full bg-gray-100 rounded animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
