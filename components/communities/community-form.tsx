"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { createCommunity } from "@/lib/actions/community-actions"

const communityFormSchema = z.object({
  name: z
    .string()
    .min(3, {
      message: "Community name must be at least 3 characters.",
    })
    .max(50, {
      message: "Community name must not be longer than 50 characters.",
    }),
  description: z
    .string()
    .min(10, {
      message: "Description must be at least 10 characters.",
    })
    .max(500, {
      message: "Description must not be longer than 500 characters.",
    }),
  isPrivate: z.boolean().default(false),
  location: z.string().optional(),
  category: z.string().optional(),
})

type CommunityFormValues = z.infer<typeof communityFormSchema>

export function CommunityForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<CommunityFormValues>({
    resolver: zodResolver(communityFormSchema),
    defaultValues: {
      name: "",
      description: "",
      isPrivate: false,
      location: "",
      category: "",
    },
  })

  async function onSubmit(data: CommunityFormValues) {
    setIsLoading(true)

    try {
      const community = await createCommunity({
        name: data.name,
        description: data.description,
        is_private: data.isPrivate,
        location: data.location || null,
        category: data.category || null,
      })

      toast({
        title: "Community created",
        description: `${data.name} has been created successfully.`,
      })

      router.push(`/community/${community.id}`)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not create community. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Community Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter community name" {...field} />
              </FormControl>
              <FormDescription>This is the name that will be displayed to members.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe what your community is about" className="min-h-32" {...field} />
              </FormControl>
              <FormDescription>
                Provide details about your community to help others understand its purpose.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Technology, Sports, Arts" {...field} />
                </FormControl>
                <FormDescription>Categorize your community to make it easier to find.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., New York, Remote" {...field} />
                </FormControl>
                <FormDescription>Add a location if your community is location-specific.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isPrivate"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Private Community</FormLabel>
                <FormDescription>Make this community private and only visible to members.</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Community"}
        </Button>
      </form>
    </Form>
  )
}
