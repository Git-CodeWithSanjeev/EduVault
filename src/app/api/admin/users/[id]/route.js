import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireAdmin } from '@/lib/adminAuth';
import { sanitizeInput } from '@/lib/security';
import { connectMongo, User } from '@/lib/mongodb';

export async function PATCH(request, context) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const { params } = context;
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { role, isVerified, name, newPassword } = body || {};

    await connectMongo();

    const updateFields = {
      ...(role !== undefined ? { role: sanitizeInput(role, 20) } : {}),
      ...(isVerified !== undefined ? { isVerified: Boolean(isVerified) } : {}),
      ...(name ? { name: sanitizeInput(name, 60) } : {}),
    };

    if (newPassword && String(newPassword).trim().length >= 8) {
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(String(newPassword).trim(), salt);
    }

    const updated = await User.findByIdAndUpdate(id, updateFields, { new: true });

    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: newPassword ? 'Password and details updated successfully' : 'User updated successfully',
      user: {
        id: updated._id.toString(),
        name: updated.name,
        email: updated.email,
        role: updated.role,
        isVerified: updated.isVerified,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const { params } = context;
    const { id } = await params;
    await connectMongo();
    await User.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to delete user' }, { status: 500 });
  }
}
