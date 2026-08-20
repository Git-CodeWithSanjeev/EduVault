import React from 'react';

export function Form({ report = false }) {
  return (
    <section className="page form-page">
      <p className="eyebrow">
        {report ? 'COPYRIGHT & TAKEDOWN' : 'CONTRIBUTE RESPONSIBLY'}
      </p>
      <h2>{report ? 'Report a rights concern' : 'Submit original learning material'}</h2>
      <p className="intro">
        {report
          ? 'We review good-faith reports and promptly remove or disable disputed resources.'
          : 'Uploads require ownership confirmation, a stated license, scanning, and human approval before publication.'}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          alert(
            'Demo workflow submitted. Connect this form to the review API in production.',
          );
        }}
      >
        <label>
          Your email
          <input required type="email" placeholder="you@example.com" />
        </label>
        <label>
          {report ? 'Resource URL or title' : 'Resource title'}
          <input required placeholder="Enter details" />
        </label>
        <label>
          {report ? 'Reason' : 'License'}
          <textarea required placeholder="Provide details" />
        </label>
        {!report && (
          <label className="check">
            <input required type="checkbox" /> I own the rights or have permission to
            share this material.
          </label>
        )}
        <button>Submit for review</button>
      </form>
    </section>
  );
}
