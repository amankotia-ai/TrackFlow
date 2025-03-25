import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";

export const RuleCardSkeleton = () => (
  <Card className="mb-4 border border-gray-200 rounded-lg">
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-5 w-10 rounded-full" />
      </div>
      
      <div className="space-y-4">
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-full rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
        
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
        <Skeleton className="h-4 w-36" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
    </div>
  </Card>
);

export const RulesListSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <RuleCardSkeleton key={i} />
    ))}
  </div>
);

export const FormSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-1/3 mb-4" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-32 w-full" />
    <div className="flex gap-4 justify-end">
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-24" />
    </div>
  </div>
);

export const StatCardSkeleton = () => (
  <Card>
    <CardHeader className="pb-2">
      <Skeleton className="h-5 w-24" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-4 w-full mt-2" />
    </CardContent>
  </Card>
);

export const ContentRuleSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-[300px] w-full mb-8" />
    
    <Skeleton className="h-5 w-48 mb-4" />
    <div className="space-y-4">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-6" />
        </div>
      ))}
    </div>
  </div>
);

export const AnalyticsSkeleton = () => (
  <>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
    
    <Card className="mb-8">
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    </div>
  </>
);

export const JourneySkeleton = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center mb-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-8 w-32" />
    </div>
    
    <div className="border rounded-md">
      <div className="p-4 border-b">
        <div className="grid grid-cols-6 gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="grid grid-cols-6 gap-4">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    </div>
  </div>
); 