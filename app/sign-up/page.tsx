"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getUpcomingDates } from "../utils/dateUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
// import { addGuest, getClubsByDate } from "../services/supabaseService"
import { supabase } from "@/lib/supabaseClient";

export default function SignUpPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    menCount: "0",
    womenCount: "0",
    bottleService: false,
    date: "",
    celebration: "",
    clubId: "",
  });
  const [clubs, setClubs] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const upcomingDates = getUpcomingDates();

  useEffect(() => {
    // Fetch clubs for the first available date when the component mounts
    if (upcomingDates.length > 0 && !formData.date) {
      const firstDate = `${upcomingDates[0].day} (${upcomingDates[0].date})`;
      setFormData((prev) => ({ ...prev, date: firstDate }));
      fetchClubs(firstDate);
    }
  }, [upcomingDates, formData.date]); // Added formData.date to dependencies

  useEffect(() => {
    if (formData.date) {
      fetchClubs(formData.date);
    }
  }, [formData.date]);

  const fetchClubs = async (date: string) => {
    const match = date.match(/\((\d{2}\/\d{2}\/\d{4})\)/);
    if (!match) {
      console.error("Invalid date format:", date);
      return [];
    }
    const extractedDate = match[1]; // Extracted "MM/DD/YYYY"
    const parsedDate = new Date(extractedDate);
    const dayName = parsedDate.toLocaleDateString("en-US", { weekday: "long" });

    // Query Supabase

    try {
      const { data: clubs, error } = await supabase
        .from("clubs")
        .select("*")
        .contains("available_dates", [dayName]);
      if (error) {
        setError(error.message || "Error fetching clubs. Please try again.");
        throw error;
      }
      setClubs(clubs);
    } catch (error) {
      setError(error.message || "Error fetching clubs. Please try again.");
      toast({
        title: "Error",
        description: error.message || "Error fetching clubs. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const voucherCode = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    try {
      const { data, error } = await supabase
        .from("guests")
        .insert({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          men_count: Number(formData.menCount),
          women_count: Number(formData.womenCount),
          bottle_service: formData.bottleService,
          date: formData.date,
          celebration: formData.celebration,
          club_id: formData.clubId,
          voucher_code: voucherCode,
        })
        .select();

      if (error) {
        throw error;
      } else {
        router.push(`/confirmation/${data[0].id}`);
      }
    } catch (error) {
      setError(error.message || "Error submitting form. Please try again.");
      toast({
        title: "Error",
        description:
          error.message || "Error submitting form. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/340164027_737893057833813_3986126282337412231_n.jpg-6mKCMz9NNE8RpFtxi86zgsiBEEYswM.jpeg"
              alt="Xclusive Chicago"
              width={150}
              height={150}
              className="mx-auto mb-4"
            />
          </Link>
          <h1 className="text-4xl font-bold mb-2 text-white">
            XCLUSIVE CHICAGO
          </h1>
          <p className="text-xl mb-4 text-gray-400">
            Experience Luxury. Experience Chicago.
          </p>
        </div>
        <div className="bg-white rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6 text-center">
                  Xclusive Chicago Guestlist Sign-Up
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="date">
                      Which night would you like to go out?
                    </Label>
                    <Select
                      value={formData.date}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, date: value }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose your night" />
                      </SelectTrigger>
                      <SelectContent>
                        {upcomingDates.map(({ day, date }) => (
                          <SelectItem key={date} value={`${day} (${date})`}>
                            {day} ({date})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-sm text-gray-500">
                    Planning for a future event? Sign up during the week of your
                    event, and we'll help accommodate you.
                  </p>

                  {formData.date && (
                    <div>
                      <Label htmlFor="clubId">Select Venue</Label>
                      <Select
                        value={formData.clubId}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, clubId: value }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select your venue" />
                        </SelectTrigger>
                        <SelectContent>
                          {clubs.map((club) => (
                            <SelectItem key={club.id} value={club.id}>
                              {club.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!formData.date || !formData.clubId}
                  className="w-full"
                >
                  Continue
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6 text-center">
                  Guestlist Details
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
                <p className="text-sm text-gray-500">
                  How many people are in your group?
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="menCount">Men in group</Label>
                    <Input
                      id="menCount"
                      name="menCount"
                      type="number"
                      value={formData.menCount}
                      onChange={handleChange}
                      required
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="womenCount">Women in group</Label>
                    <Input
                      id="womenCount"
                      name="womenCount"
                      type="number"
                      value={formData.womenCount}
                      onChange={handleChange}
                      required
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bottleService"
                    checked={formData.bottleService}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        bottleService: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor="bottleService">
                    Interested in Bottle Service
                  </Label>
                </div>

                <div>
                  <Label htmlFor="celebration">
                    Special Celebration (Optional)
                  </Label>
                  <Input
                    id="celebration"
                    name="celebration"
                    value={formData.celebration}
                    onChange={handleChange}
                  />
                </div>
                <div className="flex space-x-4">
                  <Button
                    type="button"
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="w-1/3"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="w-2/3 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="animate-spin inline-block mr-2">⭮</span>
                        Signing Up...
                      </>
                    ) : (
                      'Sign Up'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
