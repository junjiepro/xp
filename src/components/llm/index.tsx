"use client"

import { useTranslation } from "next-export-i18n"
import React from "react"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Loader2 } from "lucide-react"

export function LLM() {
  const { t } = useTranslation()
  const [messages, setMessages] = React.useState([])
  const [processing, setProcessing] = React.useState(false)

  const formSchema = z.object({
    message: z.string()
  })
  // 1. Define form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  })

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    form.setValue("message", "")
  }


  return (
    <div className="h-full">
      <Form {...form}>
        <form className="h-full" onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="h-full flex flex-col justify-between">
            <CardHeader>
              <CardTitle></CardTitle>
            </CardHeader>
            <CardContent className="h-4/5">

            </CardContent>
            <CardFooter className="h-1/5 flex flex-row justify-center space-x-2">
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel></FormLabel>
                    <FormControl>
                      <Input className="w-[600px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={processing}>
                {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t("action.continue")}</Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  )
}