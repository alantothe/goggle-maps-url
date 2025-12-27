import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { editLocationSchema, type EditLocationFormData } from "../validation/edit-location.schema";
import { useLocationById, useUpdateLocation } from "@client/shared/services/api";
import { FormInput, FormSelect } from "@client/shared/components/forms";
import { SelectItem } from "@client/components/ui";
import { SubmitButton } from "@client/shared/components/ui";

export function EditLocation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const locationId = id ? parseInt(id, 10) : null;

  const { data: location, isLoading, error: fetchError } = useLocationById(locationId);
  const { mutate, isPending, isSuccess, error: updateError } = useUpdateLocation();

  const form = useForm<EditLocationFormData>({
    resolver: zodResolver(editLocationSchema as any),
    defaultValues: {
      title: "",
      category: undefined,
      contactAddress: "",
      countryCode: "",
      phoneNumber: "",
      website: "",
    },
  });

  // Pre-populate form when location data is loaded
  useEffect(() => {
    if (location) {
      form.reset({
        title: location.title || "",
        category: location.category,
        contactAddress: location.contact.contactAddress || "",
        countryCode: location.contact.countryCode || "",
        phoneNumber: location.contact.phoneNumber || "",
        website: location.contact.website || "",
      });

      console.log("📦 Form reset complete. Category value:", form.getValues("category"));
    }
  }, [location, form]);

  // Redirect on successful update
  useEffect(() => {
    if (isSuccess) {
      navigate("/");
    }
  }, [isSuccess, navigate]);

  function handleSubmit(data: EditLocationFormData) {
    if (!locationId) return;

    // Only include fields that have values (since they're all optional)
    const updateData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined && value !== "")
    );

    mutate({ id: locationId, data: updateData });
  }

  if (isLoading) {
    return <div>Loading location...</div>;
  }

  if (fetchError) {
    return (
      <div>
        <p style={{ color: "red" }}>Error loading location: {fetchError.message}</p>
        <button onClick={() => navigate("/")}>Back to locations</button>
      </div>
    );
  }

  if (!location) {
    return (
      <div>
        <p>Location not found</p>
        <button onClick={() => navigate("/")}>Back to locations</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Edit Location</h1>
      <p className="text-gray-600 mb-4">Editing: {location.title || location.source.name}</p>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="mt-8 max-w-2xl space-y-6">
        <FormInput
          name="title"
          label="Title"
          control={form.control}
          placeholder="Location title (optional)"
        />

        <FormSelect
          name="category"
          label="Category"
          control={form.control}
          placeholder="Select a category"
        >
          <SelectItem value="dining">Dining</SelectItem>
          <SelectItem value="accommodations">Accommodations</SelectItem>
          <SelectItem value="attractions">Attractions</SelectItem>
          <SelectItem value="nightlife">Nightlife</SelectItem>
        </FormSelect>

        <FormInput
          name="contactAddress"
          label="Contact Address"
          control={form.control}
          placeholder="Contact address (optional)"
        />

        <FormInput
          name="countryCode"
          label="Country Code"
          control={form.control}
          placeholder="Country code (optional)"
        />

        <FormInput
          name="phoneNumber"
          label="Phone Number"
          control={form.control}
          placeholder="Phone number (optional)"
        />

        <FormInput
          name="website"
          label="Website"
          control={form.control}
          placeholder="Website URL (optional)"
        />

        <div className="flex gap-4">
          <SubmitButton
            isLoading={isPending}
            submitText="Update Location"
            submittingText="Updating Location..."
            disabled={!form.formState.isDirty}
            className="w-auto"
          />
          <button
            type="button"
            onClick={() => navigate("/")}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>

        {updateError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            Error: {updateError.message}
          </div>
        )}

        {isSuccess && (
          <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-500">
            Location updated successfully! Redirecting...
          </div>
        )}
      </form>
    </div>
  );
}
