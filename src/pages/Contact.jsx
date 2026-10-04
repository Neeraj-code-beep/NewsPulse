import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

const Contact = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      data.access_key = 'eff4f9b0-bc7b-4b46-8af0-05b507b2c852';

      toast.info('Your message is being sent...');

      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (result.success) {
        toast.success('Your message has been sent!');
        reset();
      } else {
        toast.error('Failed to send message.');
      }
    } catch (error) {
      toast.error('Something went wrong.');
    }
  };

  return (
    <section className="mt-10 px-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-xl mx-auto bg-white shadow-lg rounded-2xl p-6 border border-gray-200"
      >
        <h2 className="text-3xl font-bold text-center mb-6 text-black">
          Contact Form
        </h2>

        <div className="input-box mb-4">
          <label htmlFor="contact-name" className="block mb-2 font-medium text-gray-700">
            Full Name
          </label>

          <input
            id="contact-name"
            type="text"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'contact-name-error' : undefined}
            className="field w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-black"
            placeholder="Enter your name"
            {...register('name', {
              required: 'Name is required',
            })}
          />

          {errors.name && (
            <p id="contact-name-error" role="alert" className="text-red-700 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div className="input-box mb-4">
          <label htmlFor="contact-email" className="block mb-2 font-medium text-gray-700">Email</label>

          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'contact-email-error' : undefined}
            className="field w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-black"
            placeholder="Enter your email"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^\S+@\S+$/i,
                message: 'Enter a valid email',
              },
            })}
          />

          {errors.email && (
            <p id="contact-email-error" role="alert" className="text-red-700 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div className="input-box mb-6">
          <label htmlFor="contact-message" className="block mb-2 font-medium text-gray-700">
            Your Message
          </label>

          <textarea
            id="contact-message"
            rows={5}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? 'contact-message-error' : undefined}
            className="field mess w-full border border-gray-300 rounded-lg px-4 py-3 outline-none resize-none focus:ring-2 focus:ring-black"
            placeholder="Enter your message"
            {...register('message', {
              required: 'Message is required',
              minLength: {
                value: 10,
                message: 'Message should be at least 10 characters',
              },
            })}
          ></textarea>

          {errors.message && (
            <p id="contact-message-error" role="alert" className="text-red-700 text-sm mt-1">
              {errors.message.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="min-h-12 w-full rounded-lg bg-black py-3 font-semibold text-white transition duration-300 hover:bg-gray-800 disabled:opacity-60"
        >
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </section>
  );
};

export default Contact;
